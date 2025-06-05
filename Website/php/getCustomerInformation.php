<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'query.php';

class GetCustomerInformation extends Query {
    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function getCustomerInfo($customerId) {
        if (!$customerId) {
            return ['success' => false, 'message' => 'Customer ID is required.'];
        }

        try {
            $sql = "SELECT * FROM customer WHERE customer_id = ?";
            $result = $this->selectOne($sql, [$customerId]);

            if ($result) {
                return ['success' => true, 'data' => $result];
            } else {
                return ['success' => false, 'message' => 'Customer not found.'];
            }
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}

?>