<?php
require_once 'settings.php';
require_once 'database_setup.php';
require_once 'product.php';

// Set content type to JSON
header('Content-Type: application/json');

// Handle only POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Initialize database connection
    $configs = require_once 'settings.php';
    $database = new Database($configs);
    $conn = $database->getConnection();
    
    // Initialize product handler
    $handler = new ProductHandle($conn);
    
    // Process the request and output JSON response
    $response = $handler->handle($_POST);
    echo json_encode($response);
} else {
    // Return error for non-POST requests
    echo json_encode([
        'success' => false, 
        'message' => 'Only POST requests are allowed'
    ]);
    exit;
}

/**
 * ProductHandle Class
 * Handles product API requests with more structured responses
 */
class ProductHandle {
    private $product;

    /**
     * Initialize with database connection
     */
    public function __construct($conn) {
        $this->product = new Product($conn);
    }

    /**
     * Handle API requests based on action parameter
     * 
     * @param array $post POST data
     * @return array Response data
     */
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

    /**
     * Get all products
     * 
     * @return array Response data
     */
    private function getAll() {
        $products = $this->product->getAllProducts();
        return $this->response(true, 'Products retrieved', ['products' => $products]);
    }

    /**
     * Get product by ID
     * 
     * @param array $data Request data
     * @return array Response data
     */
    private function getById($data) {
        error_log("ProductHandle: getById called with data: " . print_r($data, true));
        
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            error_log("ProductHandle: Invalid ID provided: " . $id);
            return $this->response(false, 'Invalid ID');
        }

        $product = $this->product->getProductById($id);
        if (!$product) {
            error_log("ProductHandle: Product not found for ID: " . $id);
            return $this->response(false, 'Product not found');
        }

        error_log("ProductHandle: Product found: " . print_r($product, true));
        return $this->response(true, 'Product found', ['product' => $product]);
    }

    /**
     * Create a new product
     * 
     * @param array $data Product data
     * @return array Response data
     */
    private function create($data) {
        // Validate required fields
        $required = ['name', 'price', 'stock'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return $this->response(false, "$field is required");
            }
        }

        // Create product
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
            return $this->response(false, message: 'Failed to create product.');
        }

        return $this->response(true, 'Product created successfully');
    }

    /**
     * Update an existing product
     * 
     * @param array $data Product data
     * @return array Response data
     */
    private function update($data) {
        error_log("ProductHandle: update called with data: " . print_r($data, true));
        
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            error_log("ProductHandle: Invalid ID for update: " . $id);
            return $this->response(false, 'Invalid ID');
        }

        // Extract allowed fields
        $fields = array_intersect_key($data, array_flip([
            'name', 'description', 'price', 'stock',
            'category', 'image', 'barcode', 'serial_number', 'manufacter'
        ]));

        // Map manufacturer to manufacter if present
        if (isset($data['manufacturer'])) {
            $fields['manufacter'] = $data['manufacturer'];
        }

        error_log("ProductHandle: Fields to update: " . print_r($fields, true));

        // Validate fields
        if (isset($fields['price']) && $fields['price'] < 0) {
            error_log("ProductHandle: Invalid price: " . $fields['price']);
            return $this->response(false, 'Invalid price');
        }
        
        if (isset($fields['stock']) && $fields['stock'] < 0) {
            error_log("ProductHandle: Invalid stock: " . $fields['stock']);
            return $this->response(false, 'Invalid stock');
        }

        // Update product
        $success = $this->product->updateProductByFields($id, $fields);
        
        error_log("ProductHandle: Update result: " . ($success ? 'success' : 'failure'));

        if (!$success) {
            return $this->response(false, 'Failed to update product or product not found.');
        }

        return $this->response(true, 'Product updated successfully');
    }

    /**
     * Delete a product
     * 
     * @param array $data Request data
     * @return array Response data
     */
    private function delete($data) {
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) return $this->response(false, 'Invalid ID');

        $success = $this->product->deleteProductById($id);

        if (!$success) {
            return $this->response(false, 'Failed to delete product or product not found.');
        }

        return $this->response(true, 'Product deleted successfully');
    }

    /**
     * Create a standardized response
     * 
     * @param bool $success Whether the operation was successful
     * @param string $message Response message
     * @param array $data Additional data
     * @return array Formatted response
     */
    private function response($success, $message, $data = []) {
        return array_merge(['success' => $success, 'message' => $message], $data);
    }
}
?>