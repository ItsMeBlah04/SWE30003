<?php 
    require_once 'settings.php';
    require_once 'database_setup.php';
    require_once 'invoice.php';

    header('Content-Type: application/json');
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $configs = require_once 'settings.php';
        $database = new Database($configs);
        $conn = $database->getConnection();

        $handler = new InvoiceHandle($conn);

        $response = $handler->handle($_POST);
        echo json_encode($response);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Only POST requests are allowed'
        ]);
        exit;
    }

    class InvoiceHandle {
        private $invoice;

        public function __construct($conn) {
            $this->invoice = new Invoice($conn);
        }

        public function handle($post) {
            $action = $post['action'] ?? '';

            switch ($action) {
                case 'create_invoice':
                    return $this->create($post);
                default:
                    return ['success' => false, 'message' => 'Invalid action'];
            }
        }

        private function create($data) {
            return $this->invoice->create($data);
        }
    }
?>