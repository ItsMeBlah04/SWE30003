<?php
require_once 'config.php';
require_once 'database_setup.php';

class Payment extends Query {

    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function create($data) {
        $orderId = $data['order_id'] ?? null;
        $method  = $data['method'] ?? 'e-banking';
        $amount  = $data['amount'] ?? null;
        $status  = $data['status'] ?? 'successfully';

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