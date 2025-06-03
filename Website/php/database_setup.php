<?php 
require_once 'settings.php';

class Database {
    private $conn;
    private $configs;

    public function __construct($configs) {
        // Make sure we're getting a valid config array, not a boolean
        if (is_array($configs)) {
            $this->configs = $configs;
        } else {
            // Load configs from settings.php if not provided as array
            $this->configs = require 'settings.php';
        }
        
        $this->connect();
    }

    /**
     * Connect to the database and set up if needed
     */
    private function connect() {
        // Try to connect to the database
        $this->conn = @new mysqli(
            $this->configs['host'],
            $this->configs['user'],
            $this->configs['pass'],
            $this->configs['database']
        );

        // If the database doesn't exist
        if ($this->conn->connect_errno === 1049) { // Unknown database error
            $this->createDatabase();
        } elseif ($this->conn->connect_error) {
            die("Connection failed: " . $this->conn->connect_error);
        }

        // Check if required tables exist
        $this->ensureTablesExist();
    }

    /**
     * Create the database if it doesn't exist
     */
    private function createDatabase() {
        // Connect to server without selecting a database
        $tempConn = new mysqli(
            $this->configs['host'],
            $this->configs['user'],
            $this->configs['pass']
        );

        if ($tempConn->connect_error) {
            die("Connection to server failed: " . $tempConn->connect_error);
        }

        // Create the database
        $dbName = $this->configs['database'];
        $createDbSql = "CREATE DATABASE IF NOT EXISTS `$dbName`";
        
        if (!$tempConn->query($createDbSql)) {
            die("Error creating database: " . $tempConn->error);
        }

        // Select the database
        if (!$tempConn->select_db($dbName)) {
            die("Failed to select database: " . $tempConn->error);
        }

        // Create tables from SQL file
        $this->createTablesFromSqlFile($tempConn);

        // Close the temporary connection
        $tempConn->close();

        // Reconnect to the new database
        $this->conn = new mysqli(
            $this->configs['host'],
            $this->configs['user'],
            $this->configs['pass'],
            $this->configs['database']
        );

        if ($this->conn->connect_error) {
            die("Final connection failed: " . $this->conn->connect_error);
        }
    }

    /**
     * Check if required tables exist and create them if they don't
     */
    private function ensureTablesExist() {
        // Check for a required table
        $tableExists = $this->tableExists('Product');
        
        if (!$tableExists) {
            // Create a temporary connection for setting up tables
            $tempConn = new mysqli(
                $this->configs['host'],
                $this->configs['user'],
                $this->configs['pass'],
                $this->configs['database']
            );
            
            if ($tempConn->connect_error) {
                die("Temp connection failed: " . $tempConn->connect_error);
            }
            
            // Create tables
            $this->createTablesFromSqlFile($tempConn);
            
            // Close temporary connection
            $tempConn->close();
        }
    }

    /**
     * Check if a table exists
     * 
     * @param string $tableName Table name to check
     * @return bool True if table exists, false otherwise
     */
    private function tableExists($tableName) {
        if (!$this->conn) {
            return false;
        }
        
        $result = $this->conn->query("SHOW TABLES LIKE '$tableName'");
        return $result && $result->num_rows > 0;
    }

    /**
     * Create tables from SQL file
     * 
     * @param mysqli $conn Database connection
     */
    private function createTablesFromSqlFile($conn) {
        $sqlPath = dirname(__FILE__) . "/../sql/data_creation.sql";
        
        if (file_exists($sqlPath)) {
            $sql = file_get_contents($sqlPath);
            
            if (!$sql) {
                die("Failed to read SQL file at $sqlPath");
            }
            
            if ($conn->multi_query($sql)) {
                do {
                    if ($result = $conn->store_result()) {
                        $result->free();
                    }
                } while ($conn->more_results() && $conn->next_result());
                
                // Run admin setup script
                $this->setupAdminAccount($conn);
                
                // Success message (only if database was just created)
                if (!$this->tableExists('Product')) {
                    echo "Database and tables created successfully.<br>";
                }
            } else {
                die("Error running SQL file: " . $conn->error);
            }
        } else {
            die("SQL file not found at: $sqlPath");
        }
    }

    /**
     * Set up initial admin account
     * 
     * @param mysqli $conn Database connection
     */
    private function setupAdminAccount($conn) {
        $adminSqlPath = dirname(__FILE__) . "/../sql/admin_setup.sql";
        
        if (file_exists($adminSqlPath)) {
            // Need to run separate queries as multi_query might still have pending results
            $adminSql = file_get_contents($adminSqlPath);
            
            if (!$adminSql) {
                error_log("Failed to read admin SQL file");
                return;
            }
            
            // Split and run each query separately to avoid multi_query issues
            $queries = explode(';', $adminSql);
            
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    if (!$conn->query($query)) {
                        error_log("Failed to run admin setup query: " . $conn->error);
                    }
                }
            }
        } else {
            error_log("Admin setup SQL file not found at: $adminSqlPath");
        }
    }

    /**
     * Get the database connection
     * 
     * @return mysqli Database connection
     */
    public function getConnection() {
        return $this->conn;
    }
}
?>