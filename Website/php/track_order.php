<?php
header("Content-Type: application/json");

require_once("database_setup.php");
require_once("../backend/OrderTracker.php");

class TrackOrderController {
    private $orderTracker;

    public function __construct() {
        $configs = require 'settings.php';
        $db = new Database($configs);
        $conn = $db->getConnection();
        $this->orderTracker = new OrderTracker($conn);
    }

    public function handle() {
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'notify':
                $this->handleNotify();
                break;

            case 'update_shipment':
                $this->handleShipmentUpdate();
                break;

            default:
                $this->handleTracking();
                break;
        }
    }

    private function handleNotify() {
        $data = json_decode(file_get_contents("php://input"), true);

        $customerId = $data['customer_id'] ?? '';
        $type       = $data['type'] ?? '';
        $content    = $data['content'] ?? '';

        if (!$customerId || !$type || !$content) {
            echo json_encode(['error' => 'Missing notification data.']);
            return;
        }

        $success = $this->orderTracker->sendNotification($customerId, $type, $content);
        echo json_encode(['success' => $success !== false]);
    }

    private function handleShipmentUpdate() {
        $data = json_decode(file_get_contents("php://input"), true);

        $orderId = $data['order_id'] ?? '';
        $status  = $data['status'] ?? '';

        if (!$orderId || !$status) {
            echo json_encode(['error' => 'Missing shipment data.']);
            return;
        }

        $success = $this->orderTracker->updateShipmentStatus($orderId, $status);
        echo json_encode(['success' => $success !== false]);
    }

    private function handleTracking() {
        $orderId = $_GET['order_id'] ?? '';
        $name    = $_GET['name'] ?? '';
        $email   = $_GET['email'] ?? '';
        $phone   = $_GET['phone'] ?? '';

        try {
            if (!empty($orderId)) {
                $result = $this->orderTracker->getByOrderId($orderId);

                if (!$result) {
                    echo json_encode(['error' => 'No matching shipment found.']);
                    return;
                }

                echo json_encode([
                    'order_id'        => $result['order_id'],
                    'tracking_number' => $result['tracking_number'],
                    'status'          => $result['status']
                ]);
                return;
            }

            if (!empty($name) && (!empty($email) || !empty($phone))) {
                $results = $this->orderTracker->getByNameAndContact($name, $email, $phone);

                if (empty($results)) {
                    echo json_encode(['error' => 'No matching shipments found.']);
                    return;
                }

                echo json_encode([
                    'multiple' => true,
                    'orders' => array_map(function ($r) {
                        return [
                            'order_id'        => $r['order_id'],
                            'tracking_number' => $r['tracking_number'],
                            'status'          => $r['status']
                        ];
                    }, $results)
                ]);
                return;
            }

            echo json_encode(['error' => 'Please provide either Order ID or Name with Email/Phone.']);
        } catch (Exception $e) {
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
}


$controller = new TrackOrderController();
$controller->handle();
