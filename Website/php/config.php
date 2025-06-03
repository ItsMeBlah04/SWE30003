<?php
/**
 * Database Configuration
 * 
 * This file contains the database connection settings.
 * Update these values to match your phpMyAdmin configuration.
 */

// Database connection settings
define('DB_HOST', 'localhost');     // Database host (usually localhost)
define('DB_USER', 'root');          // Database username (default: root)
define('DB_PASS', '');              // Database password (default: empty for XAMPP)
define('DB_NAME', 'shop');          // Database name

// Create database connection
function getDbConnection() {
    try {
        // For debugging - log connection attempt
        error_log("Attempting to connect to MySQL database: " . DB_HOST . "/" . DB_NAME . " as user: " . DB_USER);
        
        // Create a new PDO instance for MySQL
        $conn = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8', DB_USER, DB_PASS);
        
        // Set error mode to exception
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // For debugging - log successful connection
        error_log("MySQL database connection successful");
        
        return $conn;
    } catch (PDOException $e) {
        // For debugging - log connection error
        error_log("MySQL database connection failed: " . $e->getMessage());
        die("Connection failed: " . $e->getMessage());
    }
}

// Function to execute a query and return all results
function executeQuery($query, $params = []) {
    try {
        $conn = getDbConnection();
        
        // Prepare statement
        $stmt = $conn->prepare($query);
        
        // Bind parameters if any
        if (!empty($params)) {
            // PDO handles parameter binding automatically
            $stmt->execute($params);
        } else {
            $stmt->execute();
        }
        
        // For SELECT queries
        if (stripos($query, 'SELECT') === 0) {
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return ['success' => true, 'data' => $result];
        } 
        // For INSERT, UPDATE, DELETE queries
        else {
            $affectedRows = $stmt->rowCount();
            $lastInsertId = $conn->lastInsertId();
            
            return [
                'success' => true, 
                'data' => [
                    'affected_rows' => $affectedRows,
                    'insert_id' => $lastInsertId
                ]
            ];
        }
    } catch (PDOException $e) {
        // Log and return error
        error_log("Query execution error: " . $e->getMessage());
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
?> 