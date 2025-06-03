<?php
// Set content type to plain text for easier reading
header('Content-Type: text/plain');

require_once 'database_setup.php';
require_once 'settings.php';

// Function to display table structure
function displayTableStructure($conn, $tableName) {
    echo "Table structure for '$tableName':\n";
    
    // Get table columns
    $result = $conn->query("DESCRIBE $tableName");
    
    if (!$result) {
        echo "Error getting structure: " . $conn->error . "\n";
        return;
    }
    
    // Display column details
    echo str_pad("Field", 20) . str_pad("Type", 20) . str_pad("Null", 6) . str_pad("Key", 5) . "Default\n";
    echo str_repeat("-", 70) . "\n";
    
    while ($row = $result->fetch_assoc()) {
        echo str_pad($row['Field'] ?? 'N/A', 20);
        echo str_pad($row['Type'] ?? 'N/A', 20);
        echo str_pad($row['Null'] ?? 'N/A', 6);
        echo str_pad($row['Key'] ?? 'N/A', 5);
        echo $row['Default'] ?? 'NULL';
        echo "\n";
    }
    
    echo "\n";
}

// Function to display table data
function displayTableData($conn, $tableName, $limit = 10) {
    echo "Data in '$tableName' (limited to $limit rows):\n";
    
    // Get table data
    $result = $conn->query("SELECT * FROM $tableName LIMIT $limit");
    
    if (!$result) {
        echo "Error getting data: " . $conn->error . "\n";
        return;
    }
    
    if ($result->num_rows === 0) {
        echo "No data found in this table.\n\n";
        return;
    }
    
    // Get column names
    $columns = [];
    $columnLengths = [];
    
    $firstRow = $result->fetch_assoc();
    $result->data_seek(0); // Reset pointer
    
    foreach ($firstRow as $key => $value) {
        $columns[] = $key;
        $columnLengths[$key] = max(strlen($key), 15); // Minimum 15 chars
    }
    
    // Print header
    foreach ($columns as $column) {
        echo str_pad($column, $columnLengths[$column]) . " | ";
    }
    echo "\n" . str_repeat("-", array_sum($columnLengths) + (count($columns) * 3)) . "\n";
    
    // Print data
    while ($row = $result->fetch_assoc()) {
        foreach ($columns as $column) {
            $value = $row[$column] ?? 'NULL';
            // Truncate long values
            if (strlen($value) > $columnLengths[$column]) {
                $value = substr($value, 0, $columnLengths[$column] - 3) . '...';
            }
            echo str_pad($value, $columnLengths[$column]) . " | ";
        }
        echo "\n";
    }
    
    echo "\n";
}

try {
    // Initialize database connection
    $configs = require 'settings.php';
    $database = new Database($configs);
    $conn = $database->getConnection();
    
    echo "=== DATABASE STRUCTURE CHECK ===\n\n";
    
    // Show server info
    echo "MySQL Server Info: " . $conn->server_info . "\n";
    echo "Connected to: " . $configs['host'] . "/" . $configs['database'] . "\n\n";
    
    // List all tables
    $result = $conn->query("SHOW TABLES");
    
    if (!$result) {
        echo "Error listing tables: " . $conn->error . "\n";
        exit(1);
    }
    
    echo "Tables in database:\n";
    $tables = [];
    
    while ($row = $result->fetch_row()) {
        $tables[] = $row[0];
        echo "- " . $row[0] . "\n";
    }
    
    echo "\n";
    
    // Check Authenticator table specifically
    if (in_array('Authenticator', $tables)) {
        displayTableStructure($conn, 'Authenticator');
        displayTableData($conn, 'Authenticator');
    } else {
        echo "ERROR: Authenticator table not found!\n";
    }
    
    // Check Admin table
    if (in_array('Admin', $tables)) {
        displayTableStructure($conn, 'Admin');
        displayTableData($conn, 'Admin');
    } else {
        echo "ERROR: Admin table not found!\n";
    }
    
    // Close connection
    $conn->close();
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?> 