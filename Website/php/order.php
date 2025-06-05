<?php
require_once 'config.php';
require_once 'database_setup.php';

class Order extends Query {

    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function create($data) {
        $customerId   = $data['customer_id'] ?? null;
        $totalAmount  = $data['total_amount'] ?? null;

        if (!$customerId || !$totalAmount) {
            return ['success' => false, 'message' => 'Missing customer ID or total amount.'];
        }

        try {
            $sql = "INSERT INTO orders (customer_id, date, total_amount)
                    VALUES (?, NOW(), ?)";
            $this->execute($sql, [$customerId, $totalAmount]);

            $orderId = $this->conn->lastInsertId();

            return [
                'success' => true,
                'message' => 'Order created successfully.',
                'order_id' => $orderId
            ];
        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Database error: ' . $e->getMessage()];
        }
    }
}
?>
