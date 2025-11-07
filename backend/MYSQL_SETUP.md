# MySQL Database Setup Guide

This guide will help you set up MySQL for the Fibonacci Compression System after migrating from MongoDB.

## Prerequisites

- MySQL Server 8.0 or higher
- Python 3.8+
- mysql-connector-python package (installed via requirements.txt)

## Installation Steps

### 1. Install MySQL Server

#### Windows
```bash
# Download and install MySQL from:
# https://dev.mysql.com/downloads/installer/

# Or use Chocolatey:
choco install mysql
```

#### macOS
```bash
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Secure MySQL Installation

```bash
# Run the security script
sudo mysql_secure_installation

# Follow prompts to:
# - Set root password
# - Remove anonymous users
# - Disallow root login remotely
# - Remove test database
# - Reload privilege tables
```

### 3. Create Database and User

Log into MySQL as root:
```bash
mysql -u root -p
```

Then run these SQL commands:
```sql
-- Create database
CREATE DATABASE fibonacci_compression
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'your_password' with a strong password)
CREATE USER 'fib_user'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON fibonacci_compression.* TO 'fib_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 4. Initialize Database Schema

Run the schema file to create tables:
```bash
mysql -u fib_user -p fibonacci_compression < schema.sql
```

Or manually:
```bash
mysql -u fib_user -p
USE fibonacci_compression;
SOURCE schema.sql;
```

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=fib_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=fibonacci_compression

# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_DEBUG=True

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Authentication Configuration
SECRET_KEY=your-secret-key-here
```

**Important**: Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 6. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 7. Test Database Connection

```bash
python -c "
import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

try:
    conn = mysql.connector.connect(
        host=os.getenv('MYSQL_HOST'),
        port=int(os.getenv('MYSQL_PORT')),
        user=os.getenv('MYSQL_USER'),
        password=os.getenv('MYSQL_PASSWORD'),
        database=os.getenv('MYSQL_DATABASE')
    )
    print('✓ MySQL connection successful!')
    conn.close()
except Exception as e:
    print(f'✗ MySQL connection failed: {e}')
"
```

### 8. Run the Application

```bash
python app.py
```

## Database Schema Overview

### Users Table
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **email**: VARCHAR(255) UNIQUE NOT NULL
- **password**: VARBINARY(255) NOT NULL (bcrypt hashed)
- **created_at**: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **last_login**: TIMESTAMP NULL

### Compression Logs Table
- **id**: INT AUTO_INCREMENT PRIMARY KEY
- **user_id**: INT NULL (Foreign Key to users)
- **raw_input**: TEXT NOT NULL (JSON array of numbers)
- **compressed_data**: MEDIUMTEXT NOT NULL
- **time_taken**: DECIMAL(10, 6) NOT NULL
- **compression_ratio**: VARCHAR(50) NOT NULL
- **size_reduction**: VARCHAR(50) NOT NULL
- **timestamp**: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- **source**: VARCHAR(50) DEFAULT 'direct_input'
- **filename**: VARCHAR(255) NULL
- **metrics**: JSON NULL

## Common Operations

### View All Users
```sql
SELECT id, email, created_at, last_login FROM users;
```

### View Compression Logs
```sql
SELECT id, time_taken, compression_ratio, size_reduction, timestamp, source
FROM compression_logs
ORDER BY timestamp DESC
LIMIT 10;
```

### Delete Old Logs (older than 30 days)
```sql
DELETE FROM compression_logs
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Get User Statistics
```sql
SELECT u.email, COUNT(cl.id) as compression_count
FROM users u
LEFT JOIN compression_logs cl ON u.id = cl.user_id
GROUP BY u.id, u.email;
```

## Troubleshooting

### Connection Refused
- Ensure MySQL service is running: `systemctl status mysql` (Linux) or check Services (Windows)
- Check firewall rules allow port 3306
- Verify credentials in `.env` file

### Access Denied
- Verify user has correct privileges: `SHOW GRANTS FOR 'fib_user'@'localhost';`
- Ensure password is correct in `.env`

### Table Doesn't Exist
- Run the schema.sql file: `mysql -u fib_user -p fibonacci_compression < schema.sql`
- Verify you're in the correct database: `USE fibonacci_compression;`

### Performance Issues
```sql
-- Add indexes for better performance
CREATE INDEX idx_timestamp ON compression_logs(timestamp);
CREATE INDEX idx_user_id ON compression_logs(user_id);
CREATE INDEX idx_email ON users(email);
```

## Migration Notes

### Key Differences from MongoDB

1. **Data Types**: 
   - MongoDB's flexible schema → MySQL's strict schema
   - BSON ObjectId → INT AUTO_INCREMENT
   - Nested documents → JSON columns

2. **Queries**:
   - `collection.find_one()` → `SELECT ... LIMIT 1`
   - `collection.insert_one()` → `INSERT INTO ...`
   - `collection.update_one()` → `UPDATE ... WHERE ...`

3. **Connections**:
   - MongoDB connection string → MySQL host/port/user/password
   - No DNS resolution needed
   - Connection pooling for better performance

4. **Data Storage**:
   - Arrays stored as JSON text
   - Binary password hashes stored as VARBINARY

## Production Deployment

For production environments:

1. **Use SSL/TLS**:
```python
conn = mysql.connector.connect(
    host=MYSQL_HOST,
    ssl_ca='/path/to/ca.pem',
    ssl_verify_cert=True
)
```

2. **Enable Binary Logging** (for backups):
```sql
SET GLOBAL binlog_format = 'ROW';
```

3. **Regular Backups**:
```bash
# Daily backup
mysqldump -u fib_user -p fibonacci_compression > backup_$(date +%Y%m%d).sql

# Restore from backup
mysql -u fib_user -p fibonacci_compression < backup_20241107.sql
```

4. **Monitor Performance**:
```sql
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

## Support

For issues or questions:
- Check MySQL documentation: https://dev.mysql.com/doc/
- Review application logs
- Test database connection with the test script above
