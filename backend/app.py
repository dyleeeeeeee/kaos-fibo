"""
Fibonacci Compression System - Backend API
Flask RESTful API for compressing numerical datasets using Fibonacci coding
with comparative analysis against Huffman and LZW algorithms.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error as MySQLError
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from functools import wraps
import os
import time
import hashlib
import psutil
import tracemalloc
import csv
import io
import json
import bcrypt
import jwt
from dotenv import load_dotenv

# Import compression algorithms
from algorithms.fibonacci_coding import (
    fib_encode,
    fib_decode,
    compress_dataset,
    decompress_dataset
)
from algorithms.huffman_coding import huffman_compress, huffman_decompress
from algorithms.lzw_coding import lzw_compress, lzw_decompress

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Secret key for JWT (should be in environment variables in production)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Enable CORS for frontend communication
# Allow both local development and production frontend (Cloudflare Pages)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:8000",
            "http://localhost:3000", 
            "http://127.0.0.1:8000",
            "https://fib-front.pages.dev"
        ],
        "methods": ["GET", "POST", "OPTIONS", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# MySQL Configuration
MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER', 'root')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'fibonacci_compression')
MYSQL_SSL_REQUIRED = os.getenv('MYSQL_SSL_REQUIRED', 'False').lower() == 'true'

# Initialize MySQL connection pool
try:
    # Base connection config
    pool_config = {
        'pool_name': "compression_pool",
        'pool_size': 5,
        'pool_reset_session': True,
        'host': MYSQL_HOST,
        'port': MYSQL_PORT,
        'user': MYSQL_USER,
        'password': MYSQL_PASSWORD,
        'database': MYSQL_DATABASE,
        'autocommit': False
    }
    
    # Add SSL configuration for cloud providers (Aiven, AWS RDS, etc.)
    if MYSQL_SSL_REQUIRED or 'aivencloud.com' in MYSQL_HOST or 'rds.amazonaws.com' in MYSQL_HOST:
        pool_config['ssl_disabled'] = False
        # Aiven and most cloud providers use server-side SSL verification
        # Client doesn't need to provide certificates
    
    db_pool = mysql.connector.pooling.MySQLConnectionPool(**pool_config)
    
    # Test connection
    test_conn = db_pool.get_connection()
    test_conn.close()
    
    print(f"✓ Connected to MySQL: {MYSQL_DATABASE}")
    db_connected = True
except Exception as e:
    print(f"✗ MySQL connection failed: {e}")
    db_pool = None
    db_connected = False

# ================================================
# DATABASE UTILITIES
# ================================================

def get_db_connection():
    """Get a database connection from the pool"""
    if db_pool is None:
        return None
    try:
        return db_pool.get_connection()
    except Exception as e:
        print(f"Failed to get DB connection: {e}")
        return None


def execute_query(query, params=None, fetch=False, fetch_one=False):
    """Execute a MySQL query with error handling"""
    conn = get_db_connection()
    if conn is None:
        return None
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or ())
        
        if fetch_one:
            result = cursor.fetchone()
        elif fetch:
            result = cursor.fetchall()
        else:
            conn.commit()
            result = cursor.lastrowid
        
        cursor.close()
        return result
    except Exception as e:
        conn.rollback()
        print(f"Query execution failed: {e}")
        return None
    finally:
        conn.close()


# ================================================
# AUTHENTICATION UTILITIES
# ================================================

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)


def generate_token(user_id, email):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'success': False, 'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            
            # Fetch user from MySQL
            query = "SELECT * FROM users WHERE id = %s"
            current_user = execute_query(query, (data['user_id'],), fetch_one=True)
            
            if not current_user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# ================================================
# UTILITY FUNCTIONS
# ================================================

def calculate_sha256(data_string):
    """
    Calculate SHA-256 hash of a string
    
    Args:
        data_string (str): String to hash
        
    Returns:
        str: Hexadecimal hash string
    """
    return hashlib.sha256(data_string.encode()).hexdigest()


def get_size_in_bits(data):
    """
    Calculate size of data in bits
    
    Args:
        data: Data to measure (string or list)
        
    Returns:
        int: Size in bits
    """
    if isinstance(data, str):
        # Binary string - count characters
        return len(data)
    elif isinstance(data, list):
        # Use fixed-width 32-bit integers for realistic baseline
        # This matches how integers are typically stored in memory/files
        # Alternative: could use max(data).bit_length() for adaptive sizing
        return len(data) * 32
    return 0


def get_size_in_bytes(bits):
    """
    Convert bits to bytes
    
    Args:
        bits (int): Number of bits
        
    Returns:
        float: Number of bytes
    """
    return bits / 8


def format_compression_speed(bytes_size, time_seconds):
    """
    Calculate compression speed
    
    Args:
        bytes_size (float): Size in bytes
        time_seconds (float): Time in seconds
        
    Returns:
        str: Formatted speed string
    """
    if time_seconds == 0:
        return "N/A"
    
    speed = bytes_size / time_seconds
    
    if speed < 1024:
        return f"{speed:.2f} B/s"
    elif speed < 1024 * 1024:
        return f"{speed/1024:.2f} KB/s"
    else:
        return f"{speed/(1024*1024):.2f} MB/s"


def calculate_batch_stats(numbers):
    """
    Calculate statistics for a batch of numbers
    
    Args:
        numbers (list): List of integers
        
    Returns:
        dict: Statistics dictionary
    """
    return {
        'min_value': min(numbers),
        'max_value': max(numbers),
        'avg_value': round(sum(numbers) / len(numbers), 2),
        'count': len(numbers)
    }


# ================================================
# COMPRESSION ALGORITHMS WRAPPER
# ================================================

def perform_compression(numbers):
    """
    Perform compression using Fibonacci, Huffman, and LZW algorithms
    with detailed metrics collection
    
    Args:
        numbers (list): List of positive integers to compress
        
    Returns:
        dict: Comprehensive compression results and metrics
    """
    # Start memory tracking
    tracemalloc.start()
    process = psutil.Process()
    cpu_start = process.cpu_times()
    
    # Convert input to string for hashing and comparison
    input_string = ','.join(map(str, numbers))
    original_hash = calculate_sha256(input_string)
    
    # Calculate original size
    original_bits = get_size_in_bits(numbers)
    original_bytes = get_size_in_bytes(original_bits)
    
    # ========================================
    # FIBONACCI COMPRESSION
    # ========================================
    fib_start_time = time.time()
    fib_compressed = compress_dataset(numbers)
    fib_end_time = time.time()
    fib_time = fib_end_time - fib_start_time
    
    # Verify lossless compression
    fib_decompressed = decompress_dataset(fib_compressed, len(numbers))
    is_lossless = (fib_decompressed == numbers)
    
    # Calculate Fibonacci metrics
    fib_bits = len(fib_compressed)
    fib_bytes = get_size_in_bytes(fib_bits)
    fib_ratio = original_bytes / fib_bytes if fib_bytes > 0 else 0
    fib_reduction = ((original_bytes - fib_bytes) / original_bytes * 100) if original_bytes > 0 else 0
    
    # Get compressed hash
    compressed_hash = calculate_sha256(fib_compressed)
    
    # Find max Fibonacci number used
    max_input_num = max(numbers)
    max_fib_used = 1
    a, b = 1, 2
    while a <= max_input_num:
        max_fib_used = a
        a, b = b, a + b
    
    # ========================================
    # HUFFMAN COMPRESSION (for comparison)
    # ========================================
    try:
        huffman_start = time.time()
        huffman_compressed = huffman_compress(numbers)
        huffman_time = time.time() - huffman_start
        
        huffman_bits = len(huffman_compressed)
        huffman_bytes = get_size_in_bytes(huffman_bits)
        huffman_ratio = original_bytes / huffman_bytes if huffman_bytes > 0 else 0
        huffman_reduction = ((original_bytes - huffman_bytes) / original_bytes * 100) if original_bytes > 0 else 0
    except Exception as e:
        print(f"Huffman compression failed: {e}")
        huffman_compressed = ""
        huffman_bits = 0
        huffman_bytes = 0
        huffman_ratio = 0
        huffman_reduction = 0
        huffman_time = 0
    
    # ========================================
    # LZW COMPRESSION (for comparison)
    # ========================================
    try:
        lzw_start = time.time()
        lzw_compressed = lzw_compress(input_string)
        lzw_time = time.time() - lzw_start
        
        lzw_bits = len(lzw_compressed) if isinstance(lzw_compressed, str) else len(str(lzw_compressed)) * 8
        lzw_bytes = get_size_in_bytes(lzw_bits)
        lzw_ratio = original_bytes / lzw_bytes if lzw_bytes > 0 else 0
        lzw_reduction = ((original_bytes - lzw_bytes) / original_bytes * 100) if original_bytes > 0 else 0
    except Exception as e:
        print(f"LZW compression failed: {e}")
        lzw_compressed = []
        lzw_bits = 0
        lzw_bytes = 0
        lzw_ratio = 0
        lzw_reduction = 0
        lzw_time = 0
    
    # ========================================
    # RESOURCE USAGE
    # ========================================
    cpu_end = process.cpu_times()
    cpu_time = (cpu_end.user - cpu_start.user) + (cpu_end.system - cpu_start.system)
    
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    memory_used_bytes = peak
    
    # ========================================
    # COMPARATIVE ANALYSIS
    # ========================================
    methods = {
        'Fibonacci': fib_bytes,
        'Huffman': huffman_bytes,
        'LZW': lzw_bytes
    }
    
    # Filter out methods that failed (size = 0)
    valid_methods = {k: v for k, v in methods.items() if v > 0}
    best_method = min(valid_methods.items(), key=lambda x: x[1])[0] if valid_methods else 'Fibonacci'
    
    # Calculate relative performance
    vs_huffman = f"{((fib_bytes - huffman_bytes) / huffman_bytes * 100):+.2f}%" if huffman_bytes > 0 else "N/A"
    vs_lzw = f"{((fib_bytes - lzw_bytes) / lzw_bytes * 100):+.2f}%" if lzw_bytes > 0 else "N/A"
    
    # ========================================
    # BATCH STATISTICS
    # ========================================
    batch_stats = calculate_batch_stats(numbers)
    
    # ========================================
    # COMPILE RESULTS
    # ========================================
    result = {
        'success': True,
        'compressed_data': fib_compressed[:100] + '...' if len(fib_compressed) > 100 else fib_compressed,
        'compressed_data_full': fib_compressed,
        'is_lossless': is_lossless,
        'metrics': {
            # Size Metrics
            'original_size': f"{original_bits} bits ({original_bytes:.2f} bytes)",
            'compressed_size': f"{fib_bits} bits ({fib_bytes:.2f} bytes)",
            'bytes_saved': f"{original_bytes - fib_bytes:.2f} bytes",
            'compression_ratio': f"{fib_ratio:.2f}:1",
            'size_reduction_percentage': f"{fib_reduction:.2f}%",
            
            # Performance Metrics
            'compression_time': fib_time,
            'compression_speed': format_compression_speed(original_bytes, fib_time),
            'throughput': f"{(len(numbers) / fib_time):.2f} numbers/sec" if fib_time > 0 else "N/A",
            
            # File Details
            'data_type': 'Numerical',
            'method': 'Fibonacci Coding',
            'numbers_count': len(numbers),
            
            # Algorithm Specific
            'max_fibonacci_used': max_fib_used,
            'encoding_method': "Zeckendorf's Theorem",
            'prefix_free': True,
            
            # Comparative Analysis
            'comparative': {
                'fibonacci': {
                    'size': f"{fib_bytes:.2f} bytes",
                    'ratio': f"{fib_ratio:.2f}:1",
                    'time': f"{fib_time:.4f}s"
                },
                'huffman': {
                    'size': f"{huffman_bytes:.2f} bytes",
                    'ratio': f"{huffman_ratio:.2f}:1",
                    'time': f"{huffman_time:.4f}s"
                },
                'lzw': {
                    'size': f"{lzw_bytes:.2f} bytes",
                    'ratio': f"{lzw_ratio:.2f}:1",
                    'time': f"{lzw_time:.4f}s"
                },
                'vs_huffman': vs_huffman,
                'vs_lzw': vs_lzw,
                'best_method': best_method
            },
            
            # Integrity
            'original_hash': original_hash,
            'compressed_hash': compressed_hash,
            'integrity_verified': is_lossless,
            
            # Resource Usage
            'cpu_time': cpu_time,
            'memory_used': f"{memory_used_bytes / 1024:.2f} KB",
            
            # Batch Statistics
            'batch_stats': batch_stats
        }
    }
    
    return result


# ================================================
# API ENDPOINTS
# ================================================

@app.route('/', methods=['GET'])
def index():
    """
    API root endpoint - provides API information
    """
    return jsonify({
        'name': 'Fibonacci Compression API',
        'version': '1.0.0',
        'description': 'RESTful API for compressing numerical datasets using Fibonacci coding',
        'endpoints': {
            'POST /compress': 'Compress a dataset',
            'GET /logs': 'Retrieve compression history',
            'GET /health': 'Check API health'
        },
        'powered_by': 'University of Port-Harcourt'
    })


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    mysql_status = 'connected' if db_connected else 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'mysql': mysql_status,
        'timestamp': datetime.utcnow().isoformat()
    })


# ================================================
# AUTHENTICATION ENDPOINTS
# ================================================

@app.route('/auth/signup', methods=['POST'])
def signup():
    """
    Register a new user
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    """
    try:
        if not db_connected:
            return jsonify({
                'success': False,
                'error': 'Database not connected'
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Validate email format
        if '@' not in email or '.' not in email.split('@')[1]:
            return jsonify({
                'success': False,
                'error': 'Invalid email format'
            }), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': 'Password must be at least 6 characters long'
            }), 400
        
        # Check if user already exists
        check_query = "SELECT id FROM users WHERE email = %s"
        existing_user = execute_query(check_query, (email,), fetch_one=True)
        if existing_user:
            return jsonify({
                'success': False,
                'error': 'Email already registered'
            }), 409
        
        # Hash password
        hashed_password = hash_password(password)
        
        # Insert user
        insert_query = "INSERT INTO users (email, password, created_at) VALUES (%s, %s, %s)"
        user_id = execute_query(insert_query, (email, hashed_password, datetime.utcnow()))
        
        if user_id is None:
            return jsonify({
                'success': False,
                'error': 'Failed to create user'
            }), 500
        
        # Generate token
        token = generate_token(str(user_id), email)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': str(user_id),
                'email': email
            }
        }), 201
        
    except Exception as e:
        print(f"Signup error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Registration failed'
        }), 500


@app.route('/auth/login', methods=['POST'])
def login():
    """
    Login user
    
    Request Body:
        {
            "email": "user@example.com",
            "password": "password123"
        }
    """
    try:
        if not db_connected:
            return jsonify({
                'success': False,
                'error': 'Database not connected'
            }), 503
        
        data = request.get_json()
        
        # Validate required fields
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        # Find user
        query = "SELECT * FROM users WHERE email = %s"
        user = execute_query(query, (email,), fetch_one=True)
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Verify password
        if not verify_password(password, user['password']):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Update last login
        update_query = "UPDATE users SET last_login = %s WHERE id = %s"
        execute_query(update_query, (datetime.utcnow(), user['id']))
        
        # Generate token
        user_id = str(user['id'])
        token = generate_token(user_id, email)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user_id,
                'email': user['email']
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': 'Login failed'
        }), 500


@app.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """
    Get current user information (protected endpoint)
    Requires valid JWT token in Authorization header
    """
    try:
        return jsonify({
            'success': True,
            'user': {
                'id': str(current_user['id']),
                'email': current_user['email'],
                'created_at': current_user['created_at'].isoformat() if current_user.get('created_at') else None,
                'last_login': current_user['last_login'].isoformat() if current_user.get('last_login') else None
            }
        }), 200
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get user information'
        }), 500


@app.route('/compress', methods=['POST'])
def compress():
    """
    Compress a numerical dataset using Fibonacci coding
    
    Request Body:
        {
            "data": [1, 2, 3, 4, 5],
            "timestamp": "2025-10-31T20:19:00.000Z"
        }
    
    Returns:
        JSON object with compression results and metrics
    """
    try:
        # Parse request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        numbers = data.get('data')
        
        # Validate input
        if not numbers or not isinstance(numbers, list):
            return jsonify({
                'success': False,
                'error': 'Invalid data format. Expected an array of numbers.'
            }), 400
        
        if len(numbers) == 0:
            return jsonify({
                'success': False,
                'error': 'Empty dataset provided'
            }), 400
        
        # Validate all numbers are positive integers
        for num in numbers:
            if not isinstance(num, int) or num <= 0:
                return jsonify({
                    'success': False,
                    'error': f'Invalid number: {num}. Only positive integers are supported.'
                }), 400
        
        # Perform compression
        result = perform_compression(numbers)
        
        # Store in database if available
        if db_connected:
            try:
                insert_query = """
                    INSERT INTO compression_logs 
                    (raw_input, compressed_data, time_taken, compression_ratio, 
                     size_reduction, timestamp, source, metrics) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """
                execute_query(insert_query, (
                    json.dumps(numbers),
                    result['compressed_data_full'],
                    result['metrics']['compression_time'],
                    result['metrics']['compression_ratio'],
                    result['metrics']['size_reduction_percentage'],
                    datetime.utcnow(),
                    'direct_input',
                    json.dumps(result['metrics'])
                ))
            except Exception as e:
                print(f"Failed to store in database: {e}")
        
        # Remove full compressed data from response (too large)
        del result['compressed_data_full']
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Compression error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': f'Compression failed: {str(e)}'
        }), 500


@app.route('/compress-file', methods=['POST'])
def compress_file():
    """
    Compress a numerical dataset from an uploaded CSV file
    
    Request:
        multipart/form-data with 'file' field
        
    Supported formats:
        - CSV: comma-separated values (numerical data)
    
    Returns:
        JSON object with compression results and metrics
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Get file extension
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        
        # Parse file based on extension
        try:
            if file_extension == 'csv':
                numbers = parse_csv_file(file)
            else:
                return jsonify({
                    'success': False,
                    'error': f'Unsupported file type: .{file_extension}. Only CSV files are supported.'
                }), 400
        except Exception as parse_error:
            return jsonify({
                'success': False,
                'error': f'Failed to parse file: {str(parse_error)}'
            }), 400
        
        # Validate parsed numbers
        if not numbers or len(numbers) == 0:
            return jsonify({
                'success': False,
                'error': 'No valid numerical data found in file'
            }), 400
        
        # Perform compression
        result = perform_compression(numbers)
        
        # Add file metadata to result
        result['file_info'] = {
            'filename': filename,
            'format': file_extension.upper(),
            'numbers_extracted': len(numbers)
        }
        
        # Store in database if available
        if db_connected:
            try:
                insert_query = """
                    INSERT INTO compression_logs 
                    (raw_input, compressed_data, time_taken, compression_ratio, 
                     size_reduction, timestamp, source, filename, metrics) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                execute_query(insert_query, (
                    json.dumps(numbers[:100]),  # Store first 100 numbers to save space
                    result['compressed_data_full'],
                    result['metrics']['compression_time'],
                    result['metrics']['compression_ratio'],
                    result['metrics']['size_reduction_percentage'],
                    datetime.utcnow(),
                    'file_upload',
                    filename,
                    json.dumps(result['metrics'])
                ))
            except Exception as e:
                print(f"Failed to store in database: {e}")
        
        # Remove full compressed data from response
        del result['compressed_data_full']
        
        return jsonify(result), 200
        
    except TimeoutError as e:
        print(f"File compression timeout: {e}")
        return jsonify({
            'success': False,
            'error': 'Compression took too long. Please try with a smaller file.'
        }), 504
    except Exception as e:
        print(f"File compression error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': f'File compression failed: {str(e)}'
        }), 500


def parse_csv_file(file):
    """
    Parse CSV file and extract numerical data
    
    Args:
        file: FileStorage object from Flask
        
    Returns:
        list: List of positive integers
    """
    numbers = []
    
    # Read file content
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_reader = csv.reader(stream)
    
    for row in csv_reader:
        for cell in row:
            cell = cell.strip()
            
            # Skip empty cells and headers
            if not cell or not cell[0].isdigit():
                continue
            
            try:
                # Try to parse as integer
                num = int(cell)
                
                # Validate positive integer
                if num > 0:
                    numbers.append(num)
            except ValueError:
                # Try to parse as float and convert to int
                try:
                    num = int(float(cell))
                    if num > 0:
                        numbers.append(num)
                except ValueError:
                    # Skip non-numeric values
                    continue
    
    return numbers




@app.route('/logs', methods=['GET'])
def get_logs():
    """
    Retrieve compression history from database
    
    Query Parameters:
        limit (int): Maximum number of records to return (default: 100)
        offset (int): Number of records to skip (default: 0)
    
    Returns:
        JSON array of compression records
    """
    try:
        if not db_connected:
            return jsonify({
                'success': False,
                'error': 'Database not connected'
            }), 503
        
        # Get query parameters
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Fetch logs from database
        query = """
            SELECT id, raw_input, compressed_data, time_taken, compression_ratio, 
                   size_reduction, timestamp, source, filename, metrics
            FROM compression_logs
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
        """
        logs = execute_query(query, (limit, offset), fetch=True)
        
        if logs is None:
            logs = []
        
        # Format timestamps and parse JSON fields for JSON serialization
        for log in logs:
            if 'timestamp' in log and log['timestamp']:
                log['timestamp'] = log['timestamp'].isoformat()
            if 'raw_input' in log and log['raw_input']:
                try:
                    log['raw_input'] = json.loads(log['raw_input'])
                except:
                    pass
            if 'metrics' in log and log['metrics']:
                try:
                    log['metrics'] = json.loads(log['metrics'])
                except:
                    pass
        
        return jsonify(logs), 200
        
    except Exception as e:
        print(f"Failed to retrieve logs: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to retrieve logs: {str(e)}'
        }), 500


@app.route('/decompress', methods=['POST'])
def decompress():
    """
    Decompress Fibonacci-encoded data
    
    Request Body:
        {
            "compressed_data": "110110011...",
            "count": 5
        }
    
    Returns:
        JSON object with decompressed data
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        compressed_data = data.get('compressed_data')
        count = data.get('count')
        
        if not compressed_data or not count:
            return jsonify({
                'success': False,
                'error': 'Missing compressed_data or count parameter'
            }), 400
        
        # Decompress
        decompressed = decompress_dataset(compressed_data, count)
        
        return jsonify({
            'success': True,
            'decompressed_data': decompressed
        }), 200
        
    except Exception as e:
        print(f"Decompression error: {e}")
        return jsonify({
            'success': False,
            'error': f'Decompression failed: {str(e)}'
        }), 500


# ================================================
# ERROR HANDLERS
# ================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


# ================================================
# MAIN
# ================================================

if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print("=" * 50)
    print("Fibonacci Compression API")
    print("=" * 50)
    print(f"Port: {port}")
    print(f"Debug: {debug}")
    print(f"MySQL: {'Connected' if db_connected else 'Disconnected'}")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
