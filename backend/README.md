# Fibonacci Compression Backend

Python Flask RESTful API for compressing numerical datasets using Fibonacci coding with comparative analysis.

## Features

- **Fibonacci Coding**: Lossless compression based on Zeckendorf's theorem
- **Comparative Analysis**: Benchmarks against Huffman and LZW algorithms
- **MySQL Integration**: Stores compression history and metrics in relational database
- **Comprehensive Metrics**: Size, performance, integrity, and resource usage
- **RESTful API**: Clean endpoints for compression and data retrieval
- **User Authentication**: JWT-based authentication with bcrypt password hashing

## Project Structure

```
backend/
├── app.py                      # Main Flask application
├── algorithms/
│   ├── __init__.py            # Algorithm module exports
│   ├── fibonacci_coding.py    # Fibonacci coding implementation
│   ├── huffman_coding.py      # Huffman coding for comparison
│   └── lzw_coding.py          # LZW coding for comparison
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## Installation

### Prerequisites

- **Python 3.9+** installed
- **MySQL Server 8.0+** installed and running
- **pip** package manager

### Step 1: Clone Repository

```bash
cd backend
```

### Step 2: Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Configure MySQL Database

1. **Set up MySQL database** (see [MYSQL_SETUP.md](MYSQL_SETUP.md) for detailed instructions):
   ```bash
   mysql -u root -p
   CREATE DATABASE fibonacci_compression;
   CREATE USER 'fib_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON fibonacci_compression.* TO 'fib_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

2. **Initialize database schema**:
   ```bash
   mysql -u fib_user -p fibonacci_compression < schema.sql
   ```

### Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your MySQL credentials:
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=fib_user
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=fibonacci_compression
   
   SECRET_KEY=your-secret-key-here  # Generate with: python -c "import secrets; print(secrets.token_hex(32))"
   ```

### Step 6: Run the Server

```bash
python app.py
```

Server will start at `http://localhost:5000`

## API Endpoints

### 1. Root Endpoint

**GET** `/`

Returns API information and available endpoints.

**Response:**
```json
{
  "name": "Fibonacci Compression API",
  "version": "1.0.0",
  "endpoints": {
    "POST /compress": "Compress a dataset",
    "GET /logs": "Retrieve compression history",
    "GET /health": "Check API health"
  }
}
```

### 2. Health Check

**GET** `/health`

Check API and database connectivity.

**Response:**
```json
{
  "status": "healthy",
  "mysql": "connected",
  "timestamp": "2025-10-31T20:19:00.000Z"
}
```

### 3. Compress Data

**POST** `/compress`

Compress a numerical dataset using Fibonacci coding.

**Request Body:**
```json
{
  "data": [1, 2, 3, 4, 5],
  "timestamp": "2025-10-31T20:19:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "compressed_data": "110110011101100011...",
  "is_lossless": true,
  "metrics": {
    "compression_ratio": "1.85:1",
    "size_reduction_percentage": "45.23%",
    "compression_time": 0.0023,
    "original_size": "32 bits (4.00 bytes)",
    "compressed_size": "17 bits (2.13 bytes)",
    "comparative": {
      "fibonacci": {...},
      "huffman": {...},
      "lzw": {...},
      "best_method": "Fibonacci"
    },
    "batch_stats": {
      "min_value": 1,
      "max_value": 5,
      "avg_value": 3.0
    }
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid number: -5. Only positive integers are supported."
}
```

### 4. Get Compression History

**GET** `/logs?limit=100&offset=0`

Retrieve compression history from database.

**Query Parameters:**
- `limit` (optional): Maximum records to return (default: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Response:**
```json
[
  {
    "raw_input": [1, 2, 3, 4, 5],
    "compressed_data": "110110011101100011",
    "time_taken": 0.0023,
    "compression_ratio": "1.85:1",
    "timestamp": "2025-10-31T20:19:00.000Z",
    "metrics": {...}
  }
]
```

### 5. Decompress Data

**POST** `/decompress`

Decompress Fibonacci-encoded data.

**Request Body:**
```json
{
  "compressed_data": "110110011",
  "count": 3
}
```

**Response:**
```json
{
  "success": true,
  "decompressed_data": [1, 2, 3]
}
```

## Algorithm Details

### Fibonacci Coding

Based on **Zeckendorf's Theorem**: Every positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers.

**Encoding Process:**
1. Generate Fibonacci numbers up to input value
2. Use greedy algorithm to find Zeckendorf representation
3. Create binary string (1 = Fibonacci number used)
4. Append '11' terminator

**Example:**
- `5` → Fibonacci sequence: 1, 2, 3, 5
- `5 = 5` → Code: `0001` + `1` = `00011`

**Properties:**
- ✓ Prefix-free (no codeword is prefix of another)
- ✓ Self-synchronizing ('11' terminator)
- ✓ Efficient for small numbers

### Huffman Coding

Statistical compression based on character frequency.

**Process:**
1. Count frequency of each value
2. Build binary tree with least frequent values deeper
3. Assign codes: shorter for frequent, longer for rare

### LZW Coding

Dictionary-based compression that builds patterns dynamically.

**Process:**
1. Start with single-character dictionary
2. Find longest match and output code
3. Add new pattern to dictionary
4. Continue with next input

## Testing Algorithms

Each algorithm module can be tested independently:

```bash
# Test Fibonacci coding
python algorithms/fibonacci_coding.py

# Test Huffman coding
python algorithms/huffman_coding.py

# Test LZW coding
python algorithms/lzw_coding.py
```

## Development

### Running in Debug Mode

```bash
# Set environment variable
export FLASK_DEBUG=True  # macOS/Linux
set FLASK_DEBUG=True     # Windows

# Run server
python app.py
```

### Testing with pytest

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests (when test files are created)
pytest
```

### Code Formatting

```bash
# Format code with black
black app.py algorithms/

# Check code style with flake8
flake8 app.py algorithms/
```

## Deployment

### Local Deployment

Already covered in Installation section above.

### Production Deployment (Heroku)

1. Install Heroku CLI
2. Create `Procfile`:
   ```
   web: gunicorn app:app
   ```
3. Deploy:
   ```bash
   heroku create your-app-name
   heroku config:set MONGO_URI="your-connection-string"
   git push heroku main
   ```

### Production Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
   ```json
   {
     "builds": [{"src": "app.py", "use": "@vercel/python"}],
     "routes": [{"src": "/(.*)", "dest": "app.py"}]
   }
   ```
3. Deploy: `vercel --prod`

## Troubleshooting

### MySQL Connection Issues

**Error:** `Access denied for user` or `Can't connect to MySQL server`

**Solution:**
- Verify MySQL service is running: `systemctl status mysql` (Linux) or check Services (Windows)
- Check credentials in `.env` file
- Ensure user has correct privileges: `SHOW GRANTS FOR 'fib_user'@'localhost';`
- Verify database exists: `SHOW DATABASES;`
- Check firewall rules allow port 3306

For detailed troubleshooting, see [MYSQL_SETUP.md](MYSQL_SETUP.md)

### CORS Errors

**Error:** `Access-Control-Allow-Origin` errors in browser

**Solution:**
- Ensure `flask-cors` is installed
- Check CORS configuration in `app.py`
- Verify frontend URL is allowed

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'algorithms'`

**Solution:**
- Ensure you're in the `backend` directory
- Check that `algorithms/__init__.py` exists
- Verify virtual environment is activated

## Performance Optimization

### For Large Datasets

- Consider implementing batch processing
- Add request rate limiting
- Use async processing with Celery
- Implement caching for frequently accessed data

### Database Optimization

- Indexes are already created in `schema.sql`, but you can verify:
  ```sql
  SHOW INDEX FROM compression_logs;
  SHOW INDEX FROM users;
  ```
- Implement pagination for logs endpoint (already supported via `limit` and `offset` params)
- Archive old compression logs:
  ```sql
  DELETE FROM compression_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
  ```
- Monitor query performance:
  ```sql
  SHOW PROCESSLIST;
  EXPLAIN SELECT * FROM compression_logs ORDER BY timestamp DESC LIMIT 100;
  ```

## Contributing

1. Create feature branch
2. Make changes with tests
3. Format code: `black .`
4. Check style: `flake8 .`
5. Submit pull request

## License

Educational project for demonstrating Fibonacci coding compression.

## References

- Fraenkel, A. S., & Klein, S. T. (1996). Robust universal complete codes
- Huffman, D. A. (1952). A method for the construction of minimum-redundancy codes
- Welch, T. A. (1984). A technique for high-performance data compression
- Zeckendorf, E. (1972). Représentation des nombres naturels

## Support

For issues or questions:
- Check troubleshooting section
- Review API documentation
- Examine server logs for errors

---

**Powered by University of Port-Harcourt** 🚀
