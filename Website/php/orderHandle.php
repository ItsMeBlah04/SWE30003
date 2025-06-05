<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'order.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $configs = require_once 'settings.php';
    $database = new Database($configs);
    $conn = $database->getConnection();

    $handler = new OrderHandle($conn);

    $response = $handler->handle($_POST);
    echo json_encode($response);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}

class OrderHandle {
    private $order;

    public function __construct($conn) {
        $this->order = new Order($conn);
    }

    public function handle($post) {
        $action = $post['action'] ?? '';

        switch ($action) {
            case 'create':
                return $this->create($post);
            default:
                return ['success' => false, 'message' => 'Invalid action'];
        }
    }

    private function create($data) {
        return $this->order->create($data);
    }

}
?>