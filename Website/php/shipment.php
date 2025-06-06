<?php 
    require_once 'settings.php';
    require_once 'database_setup.php';
    require_once 'query.php';
    require_once 'order.php';

    class Shipment extends Query {
        private $order;

        public function __construct($conn) {
            parent::__construct($conn);
            $this->order = new Order($conn);
        }

        public function create($data) {
            $orderId = $data['order_id'];
            $trackingNumber = $data['tracking_number'];
            $status = "peding";

            $stmt = $this->conn->prepare("INSERT INTO shipment (order_id, tracking_number, status) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $orderId, $trackingNumber, $status);

            if ($stmt->execute()) {
                $shipmentId = $this->conn->insert_id; 
                return [
                    'success' => true,
                    'data' => [
                        'shipment_id' => $shipmentId,
                        'tracking_number' => $trackingNumber,
                        'status' => $status
                    ]
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Failed to create shipment: ' . $stmt->error
                ];
            }
        }

        public function getShipmentByCustomerId($customerId) {
            $orderIds = $this->order->getListOrderIDs($customerId);
            if (empty($orderIds)) {
                return [
                    'success' => false,
                    'message' => 'No orders found for this customer'
                ];
            }

            $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
            $types = str_repeat('i', count($orderIds));

            $stmt = $this->conn->prepare("SELECT * FROM shipment WHERE order_id IN ($placeholders)");
            if (!$stmt) {
                throw new Exception("Failed to prepare statement: " . $this->conn->error);
            }

            $stmt->bind_param($types, ...$orderIds);
            $stmt->execute();
            $result = $stmt->get_result();

            $shipments = [];
            while ($row = $result->fetch_assoc()) {
                $shipments[] = $row;
            }

            return [
                'success' => true,
                'data' => $shipments
            ];
        }
    }
?>