<?php 
    require_once 'settings.php';
    require_once 'database_setup.php';
    require_once 'query.php';

    class Invoice extends Query {

        public function __construct($conn) {
            parent::__construct($conn);
        }

        public function create($data) {
            $orderId = $data['order_id'];
            $total = $data['amount'];
            $tax = $data['tax'];

            // Prepare the SQL statement to insert a new invoice
            $stmt = $this->conn->prepare("INSERT INTO invoice (order_id, date, tax, total) VALUES (?, NOW(), ?, ?)");
            $stmt->bind_param("idd", $orderId, $tax, $total);

            if ($stmt->execute()) {
                $invoiceId = $this->conn->insert_id; 
                return [
                    'success' => true,
                    'data' => [
                        'invoice_id' => $invoiceId
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create invoice: ' . $stmt->error
                ];
            }
        }
    }
?>