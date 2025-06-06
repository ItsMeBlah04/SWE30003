<?php
    require_once 'settings.php';
    require_once 'database_setup.php';
    require_once 'shipment.php';

    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $configs = require_once 'settings.php';
        $database = new Database($configs);
        $conn = $database->getConnection();

        $handler = new ShipmentHandle($conn);

        $response = $handler->handle($_POST);
        echo json_encode($response);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Only POST requests are allowed'
        ]);
        exit;
    }

    class ShipmentHandle {
        private $shipment;

        public function __construct($conn) {
            $this->shipment = new Shipment($conn);
        }

        public function handle($post) {
            $action = $post['action'] ?? '';

            switch ($action) {
                case 'create_shipment':
                    return $this->create($post);
                case 'get_shipments_by_customer_id':
                    return $this->getShipmentByCustomerId($post);
                default:
                    return ['success' => false, 'message' => 'Invalid action'];
            }
        }

        private function create($data) {
            return $this->shipment->create($data);
        }

        public function getShipmentByCustomerId($post) {
            $customerId = $post['customer_id'] ?? null;
            if (!$customerId) {
                return ['success' => false, 'message' => 'Missing customer_id'];
            }

            try {
                $shipment = $this->shipment->getShipmentByCustomerId($customerId);
                return ['success' => true, 'data' => $shipment];
            } catch (Exception $e) {
                return ['success' => false, 'message' => $e->getMessage()];
            }
        }
    }
?>