#!/usr/bin/env python3
"""
Initialize Aiven MySQL Database Schema
Run this script to create tables on your Aiven MySQL instance
"""

import mysql.connector
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

MYSQL_HOST = os.getenv('MYSQL_HOST')
MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
MYSQL_USER = os.getenv('MYSQL_USER')
MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD')
MYSQL_DATABASE = os.getenv('MYSQL_DATABASE')

print("=" * 60)
print("Aiven MySQL Database Initialization")
print("=" * 60)
print(f"Host: {MYSQL_HOST}")
print(f"Port: {MYSQL_PORT}")
print(f"User: {MYSQL_USER}")
print(f"Database: {MYSQL_DATABASE}")
print("=" * 60)

try:
    # Connect to MySQL
    print("\n[1/3] Connecting to Aiven MySQL...")
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        ssl_disabled=False  # Enable SSL for Aiven
    )
    cursor = conn.cursor()
    print("✓ Connected successfully!")
    
    # Create users table
    print("\n[2/3] Creating 'users' table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARBINARY(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP NULL,
            INDEX idx_email (email),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ 'users' table created!")
    
    # Create compression_logs table
    print("\n[3/3] Creating 'compression_logs' table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS compression_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            raw_input TEXT NOT NULL,
            compressed_data MEDIUMTEXT NOT NULL,
            time_taken DECIMAL(10, 6) NOT NULL,
            compression_ratio VARCHAR(50) NOT NULL,
            size_reduction VARCHAR(50) NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source VARCHAR(50) DEFAULT 'direct_input',
            filename VARCHAR(255) NULL,
            metrics JSON NULL,
            
            INDEX idx_timestamp (timestamp),
            INDEX idx_user_id (user_id),
            INDEX idx_source (source),
            
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✓ 'compression_logs' table created!")
    
    # Commit changes
    conn.commit()
    
    # Verify tables
    print("\n" + "=" * 60)
    print("Verifying tables...")
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"✓ Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")
    
    print("\n" + "=" * 60)
    print("✓ Database initialization complete!")
    print("=" * 60)
    print("\nYou can now run: python app.py")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"\n✗ MySQL Error: {err}")
    print("\nTroubleshooting:")
    print("1. Verify credentials in .env file")
    print("2. Check if Aiven service is running")
    print("3. Ensure your IP is whitelisted in Aiven console")
    print("4. Verify SSL is enabled")
    exit(1)
except Exception as e:
    print(f"\n✗ Error: {e}")
    exit(1)
