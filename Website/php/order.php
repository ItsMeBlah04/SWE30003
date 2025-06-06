<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'query.php';

class Order extends Query {

    public function __construct($conn) {
        parent::__construct($conn);
    }

    public function create($data) {
        $customerId = $data['customer_id'];
        $total = $data['total_amount'];

        $stmt = $this->conn->prepare("INSERT INTO orders (customer_id, date, total_amount) VALUES (?, NOW(), ?)");
        $stmt->bind_param("id", $customerId, $total);

        if ($stmt->execute()) {
            $orderId = $this->conn->insert_id; 
            return [
                'success' => true,
                'data' => [
                    'order_id' => $orderId
                ]
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Failed to create order: ' . $stmt->error
            ];
        }
    }
    public function getListOrderIDs($customerId) {
        $query = "SELECT order_id FROM orders WHERE customer_id = ?";
        $stmt = $this->conn->prepare($query);

        if (!$stmt) {
            throw new Exception("Failed to prepare statement: " . $this->conn->error);
        }

        $stmt->bind_param("i", $customerId);
        $stmt->execute();
        $result = $stmt->get_result();

        $orderIds = [];
        while ($row = $result->fetch_assoc()) {
            $orderIds[] = $row['order_id'];  
        }

        return $orderIds; // returns: [143, 144, 150, ...]
    }
}
?>
