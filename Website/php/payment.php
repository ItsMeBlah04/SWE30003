<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'query.php';

class Payment extends Query {

    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function create($data) {
        $orderId = $data['order_id'];
        $method  = $data['payment_method'];
        $amount  = $data['amount'];
        $status  = 'successfully';

        // Validate inputs
        if (!$orderId || !$amount || !$method || !$status) {
            return ['success' => false, 'message' => 'Missing required fields.'];
        }

        try {
            $sql = "INSERT INTO payment (order_id, method, amount, date, status)
                    VALUES (?, ?, ?, NOW(), ?)";
            $this->execute($sql, [$orderId, $method, $amount, $status]);

            return ['success' => true, 'message' => 'Payment recorded successfully.'];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}
?>