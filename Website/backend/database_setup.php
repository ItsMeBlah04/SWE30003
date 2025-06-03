<?php 
require_once 'settings.php';

class Database {
    private $conn;
    private $configs;

    public function __construct($configs) {
        $this->configs = $configs;
        $this->isConnected();
    }

    private function isConnected() {
        // Try to connect to the database
        $this->conn = @new mysqli(
            $this->configs['host'],
            $this->configs['user'],
            $this->configs['pass'],
            $this->configs['database']
        );

        // If the database doesn't exist
        if ($this->conn->connect_errno === 1049) { // Unknown database error log
            $tempConn = new mysqli(
                $this->configs['host'],
                $this->configs['user'],
                $this->configs['pass']
            );

            if ($tempConn->connect_error) {
                die("Connection to server failed: " . $tempConn->connect_error);
            }

            // Create DB and tables
            $this->databaseSetup($tempConn);

            // Reconnect to the actual database
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

        // Optional: check for a required table and run setup if missing
        if (!$this->tableExists('products')) {
            $tempConn = new mysqli(
                $this->configs['host'],
                $this->configs['user'],
                $this->configs['pass']
            );
            $this->databaseSetup($tempConn);
            $this->conn = new mysqli(
                $this->configs['host'],
                $this->configs['user'],
                $this->configs['pass'],
                $this->configs['database']
            );
        }
    }

    private function tableExists($tableName) {
        $check = $this->conn->query("SHOW TABLES LIKE '$tableName'");
        return $check && $check->num_rows > 0;
    }

    private function databaseSetup($conn): void {
        $dbName = $this->configs['database'];

        // 1. Create the database if it doesn't exist
        $createDbSql = "CREATE DATABASE IF NOT EXISTS `$dbName`";
        if (!$conn->query($createDbSql)) {
            die("Error creating database: " . $conn->error);
        }

        // 2. Select the database to use
        if (!$conn->select_db($dbName)) {
            die("Failed to select database: " . $conn->error);
        }

        // 3. Load and run SQL file for table creation
        $sql = file_get_contents("sql/data_creation.sql");
        if (!$sql) {
            die("Failed to read SQL file.");
        }

        if ($conn->multi_query($sql)) {
            do {
                if ($result = $conn->store_result()) {
                    $result->free();
                }
            } while ($conn->more_results() && $conn->next_result());

            echo "Database and tables created successfully.<br>";
        } else {
            die("Error running SQL file: " . $conn->error);
        }

        $conn->close();
    }

    public function getConnection() {
        return $this->conn;
    }
}
?>