<?php
// Set headers for plain text output
header('Content-Type: text/plain');

// Enable error reporting
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "SQLite Database Check\n";
echo "====================\n\n";

// Database path
$db_file = __DIR__ . '/../shop.db';
echo "Database path: $db_file\n";

// Check if file exists
if (!file_exists($db_file)) {
    echo "ERROR: Database file not found!\n";
    exit(1);
}

echo "Database file exists. Size: " . filesize($db_file) . " bytes\n\n";

// Check if SQLite extension is loaded
if (!extension_loaded('pdo_sqlite')) {
    echo "ERROR: PDO SQLite extension is not loaded!\n";
    echo "Please enable the pdo_sqlite extension in your php.ini file and restart your server.\n";
    exit(1);
}

echo "PDO SQLite extension is loaded.\n\n";

// Try to connect to the database
try {
    $db = new PDO('sqlite:' . $db_file);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Successfully connected to the database.\n\n";
    
    // Check tables
    echo "Checking tables:\n";
    $tables = ['ORDERS', 'ORDERS_ITEM', 'PRODUCT'];
    
    foreach ($tables as $table) {
        $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='$table'");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            echo "- Table $table: EXISTS\n";
            
            // Count rows
            $count = $db->query("SELECT COUNT(*) as count FROM $table")->fetch(PDO::FETCH_ASSOC);
            echo "  - Rows: " . $count['count'] . "\n";
            
            // Get column info
            $columns = $db->query("PRAGMA table_info($table)")->fetchAll(PDO::FETCH_ASSOC);
            echo "  - Columns: " . count($columns) . "\n";
            echo "  - Column names: ";
            $column_names = [];
            foreach ($columns as $col) {
                $column_names[] = $col['name'];
            }
            echo implode(', ', $column_names) . "\n";
            
            // Sample data
            $sample = $db->query("SELECT * FROM $table LIMIT 1")->fetch(PDO::FETCH_ASSOC);
            if ($sample) {
                echo "  - Sample row: " . json_encode($sample) . "\n";
            }
            
            echo "\n";
        } else {
            echo "- Table $table: MISSING\n\n";
        }
    }
    
} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\nDatabase check completed.\n";
?> 