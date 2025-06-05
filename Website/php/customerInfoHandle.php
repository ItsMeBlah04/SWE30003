<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'getCustomerInformation.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $configs = require_once 'settings.php';
    $database = new Database($configs);
    $conn = $database->getConnection();

    $handler = new GetCustomerInformationHandle($conn);

    $action = $_POST['action'] ?? '';
    $customerId = $_POST['customer_id'] ?? null;

    $response = $handler->handle($action, $customerId);
    echo json_encode($response);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}


class GetCustomerInformationHandle {
    private $customerInfo;

    public function __construct($conn) {
        $this->customerInfo = new GetCustomerInformation($conn);
    }

    public function handle($action, $customerId) {
        switch ($action) {
            case 'get_customer_info':
                return $this->customerInfo->getCustomerInfo($customerId);
            default:
                return ['success' => false, 'message' => 'Invalid action'];
        }
    }
}

?>