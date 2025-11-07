#!/usr/bin/env python3
"""
Test Aiven MySQL Connection
Quick script to verify your Aiven MySQL credentials work
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
print("Testing Aiven MySQL Connection")
print("=" * 60)
print(f"Host: {MYSQL_HOST}")
print(f"Port: {MYSQL_PORT}")
print(f"User: {MYSQL_USER}")
print(f"Database: {MYSQL_DATABASE}")
print(f"SSL: {'Enabled' if 'aivencloud.com' in MYSQL_HOST else 'Disabled'}")
print("=" * 60)

try:
    print("\nConnecting...")
    
    # Determine SSL requirement
    ssl_required = 'aivencloud.com' in MYSQL_HOST or os.getenv('MYSQL_SSL_REQUIRED', 'False').lower() == 'true'
    
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        ssl_disabled=not ssl_required
    )
    
    print("✓ Connection successful!\n")
    
    # Test query
    cursor = conn.cursor()
    cursor.execute("SELECT VERSION()")
    version = cursor.fetchone()
    print(f"MySQL Version: {version[0]}")
    
    # Show databases
    cursor.execute("SHOW DATABASES")
    databases = cursor.fetchall()
    print(f"\nAvailable databases ({len(databases)}):")
    for db in databases:
        marker = "←" if db[0] == MYSQL_DATABASE else ""
        print(f"  - {db[0]} {marker}")
    
    # Check if tables exist
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print(f"\nTables in '{MYSQL_DATABASE}' ({len(tables)}):")
    if tables:
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("  (No tables found - run init_aiven_db.py to create schema)")
    
    cursor.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("✓ All checks passed!")
    print("=" * 60)
    
    if not tables:
        print("\nNext step: Run 'python init_aiven_db.py' to create tables")
    else:
        print("\nYou're ready to run: python app.py")
    
except mysql.connector.Error as err:
    print(f"\n✗ Connection failed!")
    print(f"Error: {err}\n")
    print("Troubleshooting:")
    print("1. Check credentials in .env file")
    print("2. Verify Aiven service is running (check Aiven console)")
    print("3. Ensure your IP is whitelisted in Aiven firewall settings")
    print("4. Confirm SSL is properly configured")
    print("5. Test connection from Aiven console first")
    exit(1)
except Exception as e:
    print(f"\n✗ Unexpected error: {e}")
    exit(1)
