<?php
header("Content-Type: application/json");

require_once("database_setup.php");
require_once("../backend/OrderTracker.php");

// Load database config and initialize
$configs = require_once 'settings.php';
$db = new Database($configs);
$conn = $db->getConnection();
$orderTracker = new OrderTracker($conn);

// Action handler
$action = $_GET['action'] ?? '';

//  Handle Notifier Action
if ($action === 'notify') {
    $data = json_decode(file_get_contents("php://input"), true);

    $customerId = $data['customer_id'] ?? '';
    $type       = $data['type'] ?? '';
    $content    = $data['content'] ?? '';

    if (!$customerId || !$type || !$content) {
        echo json_encode(['error' => 'Missing notification data.']);
        exit;
    }

    $success = $orderTracker->sendNotification($customerId, $type, $content);
    echo json_encode(['success' => $success !== false]);
    exit;
}

//  Handle Shipment Status Update
if ($action === 'update_shipment') {
    $data = json_decode(file_get_contents("php://input"), true);

    $orderId = $data['order_id'] ?? '';
    $status  = $data['status'] ?? '';

    if (!$orderId || !$status) {
        echo json_encode(['error' => 'Missing shipment data.']);
        exit;
    }

    $success = $orderTracker->updateShipmentStatus($orderId, $status);
    echo json_encode(['success' => $success !== false]);
    exit;
}

//   tracking flow
$orderId = $_GET['order_id'] ?? '';
$name    = $_GET['name'] ?? '';
$email   = $_GET['email'] ?? '';
$phone   = $_GET['phone'] ?? '';

try {
    // Option 1: Track by Order ID
    if (!empty($orderId)) {
        $result = $orderTracker->getByOrderId($orderId);

        if (!$result) {
            echo json_encode(['error' => 'No matching shipment found.']);
            exit;
        }

        echo json_encode([
            'order_id'        => $result['order_id'],
            'tracking_number' => $result['tracking_number'],
            'status'          => $result['status']
        ]);
        exit;
    }

    // Option 2: Track by Name + Email/Phone
    if (!empty($name) && (!empty($email) || !empty($phone))) {
        $results = $orderTracker->getByNameAndContact($name, $email, $phone);

        if (empty($results)) {
            echo json_encode(['error' => 'No matching shipments found.']);
            exit;
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
        exit;
    }

    echo json_encode(['error' => 'Please provide either Order ID or Name with Email/Phone.']);
} catch (Exception $e) {
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
