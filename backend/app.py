"""
Fibonacci Compression System - Backend API
Flask RESTful API for compressing numerical datasets using Fibonacci coding
with comparative analysis against Huffman and LZW algorithms.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
from werkzeug.utils import secure_filename
import os
import time
import hashlib
import psutil
import tracemalloc
import csv
import io
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
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'fibonacci_compression')
COLLECTION_NAME = os.getenv('COLLECTION_NAME', 'compression_logs')

# Configure DNS resolver to use Google DNS (fixes Windows DNS timeout issues)
try:
    import dns.resolver
    resolver = dns.resolver.Resolver()
    resolver.nameservers = ['8.8.8.8', '1.1.1.1']
    dns.resolver.default_resolver = resolver
    print("✓ DNS resolver configured (8.8.8.8, 1.1.1.1)")
except ImportError:
    print("⚠ dnspython not installed - DNS resolution may fail")

# Initialize MongoDB client
try:
    mongo_client = MongoClient(MONGO_URI)
    # Test connection
    mongo_client.admin.command('ping')
    db = mongo_client[DB_NAME]
    collection = db[COLLECTION_NAME]
    print(f"✓ Connected to MongoDB: {DB_NAME}")
except Exception as e:
    print(f"✗ MongoDB connection failed: {e}")
    collection = None

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
    mongo_status = 'connected' if collection is not None else 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'mongodb': mongo_status,
        'timestamp': datetime.utcnow().isoformat()
    })


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
        if collection is not None:
            try:
                log_entry = {
                    'raw_input': numbers,
                    'compressed_data': result['compressed_data_full'],
                    'time_taken': result['metrics']['compression_time'],
                    'compression_ratio': result['metrics']['compression_ratio'],
                    'size_reduction': result['metrics']['size_reduction_percentage'],
                    'timestamp': datetime.utcnow(),
                    'metrics': result['metrics']
                }
                collection.insert_one(log_entry)
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
        if collection is not None:
            try:
                log_entry = {
                    'raw_input': numbers[:100],  # Store first 100 numbers to save space
                    'compressed_data': result['compressed_data_full'],
                    'time_taken': result['metrics']['compression_time'],
                    'compression_ratio': result['metrics']['compression_ratio'],
                    'size_reduction': result['metrics']['size_reduction_percentage'],
                    'timestamp': datetime.utcnow(),
                    'source': 'file_upload',
                    'filename': filename,
                    'metrics': result['metrics']
                }
                collection.insert_one(log_entry)
            except Exception as e:
                print(f"Failed to store in database: {e}")
        
        # Remove full compressed data from response
        del result['compressed_data_full']
        
        return jsonify(result), 200
        
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
        if collection is None:
            return jsonify({
                'success': False,
                'error': 'Database not connected'
            }), 503
        
        # Get query parameters
        limit = request.args.get('limit', default=100, type=int)
        offset = request.args.get('offset', default=0, type=int)
        
        # Fetch logs from database
        logs = list(collection.find(
            {},
            {'_id': 0}  # Exclude MongoDB _id field
        ).sort('timestamp', -1).skip(offset).limit(limit))
        
        # Format timestamps for JSON serialization
        for log in logs:
            if 'timestamp' in log:
                log['timestamp'] = log['timestamp'].isoformat()
        
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
    print(f"MongoDB: {'Connected' if collection is not None else 'Disconnected'}")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
