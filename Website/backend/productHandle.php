<?php
require_once 'settings.php';
require_once 'Database.php';
require_once 'Product.php';

// Initialize database connection
$db = new Database($configs);
$conn = $db->getConnection();

header('Content-Type: application/json');

// Handle only POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $handler = new ProductHandle($conn);
    $response = $handler->handle($_POST);
    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

class ProductHandle {
    private $product;

    public function __construct($conn) {
        $this->product = new Product($conn);
    }

    public function handle($post) {
        $action = $post['action'] ?? '';

        switch ($action) {
            case 'get_all':
                return $this->getAll();
            case 'get_product':
                return $this->getById($post);
            case 'create':
                return $this->create($post);
            case 'update':
                return $this->update($post);
            case 'delete':
                return $this->delete($post);
            default:
                return $this->response(false, 'Invalid action');
        }
    }

    private function getAll() {
        $products = $this->product->getAllProducts();
        return $this->response(true, 'Products retrieved', ['products' => $products]);
    }

    private function getById($data) {
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) return $this->response(false, 'Invalid ID');

        $product = $this->product->getProductById($id);
        if (!$product) return $this->response(false, 'Product not found');

        return $this->response(true, 'Product found', ['product' => $product]);
    }

    private function create($data) {
        $required = ['name', 'price', 'stock'];
        foreach ($required as $field) {
            if (empty($data[$field])) return $this->response(false, "$field is required");
        }

        $success = $this->product->addProduct(
            $data['name'],
            (float)$data['price'],
            $data['description'] ?? '',
            (int)$data['stock'],
            $data['category'] ?? '',
            $data['image'] ?? '',
            $data['barcode'] ?? '',
            $data['serial_number'] ?? '',
            $data['manufacturer'] ?? ''
        );

        if (!$success) {
            return $this->response(false, 'Failed to create product.');
        }

        return $this->response(true, 'Product created');
    }

    private function update($data) {
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) return $this->response(false, 'Invalid ID');

        $fields = array_intersect_key($data, array_flip([
            'name', 'description', 'price', 'stock',
            'category', 'image', 'barcode', 'serial_number', 'manufacturer'
        ]));

        if (isset($fields['price']) && $fields['price'] < 0) return $this->response(false, 'Invalid price');
        if (isset($fields['stock']) && $fields['stock'] < 0) return $this->response(false, 'Invalid stock');

        $success = $this->product->updateProductByFields($id, $fields);

        if (!$success) {
            return $this->response(false, 'Failed to update product or product not found.');
        }

        return $this->response(true, 'Product updated');
    }

    private function delete($data) {
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) return $this->response(false, 'Invalid ID');

        $success = $this->product->deleteProductById($id);

        if (!$success) {
            return $this->response(false, 'Failed to delete product or product not found.');
        }

        return $this->response(true, 'Product deleted');
    }

    private function response($success, $message, $data = []) {
        return array_merge(['success' => $success, 'message' => $message], $data);
    }
}
?>