-- ================================================
-- Fibonacci Compression System - MySQL Schema
-- Database schema for MySQL migration
-- ================================================

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS fibonacci_compression
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fibonacci_compression;

-- ================================================
-- USERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARBINARY(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- COMPRESSION LOGS TABLE
-- ================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- SAMPLE DATA (Optional - for testing)
-- ================================================
-- Uncomment to insert sample data
-- INSERT INTO users (email, password, created_at)
-- VALUES ('test@example.com', '$2b$12$example_hash', NOW());
