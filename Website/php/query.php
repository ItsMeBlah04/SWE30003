<?php
class Query {
    protected $conn;

    public function __construct($conn) {
        $this->conn = $conn;

        if ($this->conn->connect_error) {
            die("Database connection failed: " . $this->conn->connect_error);
        }
    }

    // SELECT multiple rows
    public function select($sql, $params = []) {
        $stmt = $this->prepareAndBind($sql, $params);
        if (!$stmt) return false;

        if (!$stmt->execute()) {
            error_log("Select failed: " . $stmt->error);
            return false;
        }

        $result = $stmt->get_result();
        return $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
    }

    // SELECT single row
    public function selectOne($sql, $params = []) {
        $stmt = $this->prepareAndBind($sql, $params);
        if (!$stmt) return false;

        if (!$stmt->execute()) {
            error_log("SelectOne failed: " . $stmt->error);
            return false;
        }

        $result = $stmt->get_result();
        return $result ? $result->fetch_assoc() : null;
    }

    // INSERT, UPDATE, DELETE
    public function execute($sql, $params = []) {
        $stmt = $this->prepareAndBind($sql, $params);
        if (!$stmt) return false;

        if (!$stmt->execute()) {
            error_log("Execute failed: " . $stmt->error);
            return false;
        }

        return true;
    }

    // PREPARE & BIND
    private function prepareAndBind($sql, $params) {
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log("Prepare failed: " . $this->conn->error);
            return false;
        }

        if (!empty($params)) {
            $types = '';
            foreach ($params as $param) {
                $types .= is_int($param) ? 'i' : (is_float($param) ? 'd' : 's');
            }

            if (!$stmt->bind_param($types, ...$params)) {
                error_log("Bind failed: " . $stmt->error);
                return false;
            }
        }

        return $stmt;
    }
}
?>