<?php
/**
 * Products API
 * 
 * Handles product-related operations (CRUD)
 */

// Include database configuration
require_once 'config.php';

// Set headers for API response
header('Content-Type: application/json');

// Get request data
$requestMethod = $_SERVER['REQUEST_METHOD'];
$action = isset($_POST['action']) ? $_POST['action'] : '';

// If this is a POST request
if ($requestMethod === 'POST') {
    // Handle different actions
    switch ($action) {
        case 'get_all':
            getAllProducts();
            break;
        case 'get_product':
            getProductById();
            break;
        case 'create':
            createProduct();
            break;
        case 'update':
            updateProduct();
            break;
        case 'delete':
            deleteProduct();
            break;
        default:
            sendResponse(false, 'Invalid action');
    }
} else {
    // Only POST requests are allowed
    sendResponse(false, 'Invalid request method');
}

/**
 * Get all products
 */
function getAllProducts() {
    // Get products from database
    $query = "SELECT * FROM Product";
    $result = executeQuery($query);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Map product_id to id for frontend compatibility
    $products = [];
    foreach ($result['data'] as $product) {
        // Create a copy of the product with id instead of product_id
        $productWithId = $product;
        $productWithId['id'] = $product['product_id'];
        $products[] = $productWithId;
    }
    
    // Return success response with products
    sendResponse(true, 'Products retrieved successfully', [
        'products' => $products
    ]);
}

/**
 * Get product by ID
 */
function getProductById() {
    // Get product ID from request
    $productId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    
    // Validate input
    if ($productId <= 0) {
        sendResponse(false, 'Invalid product ID');
        return;
    }
    
    // Get product from database
    $query = "SELECT * FROM Product WHERE product_id = ?";
    $params = [$productId];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Check if product exists
    if (count($result['data']) === 0) {
        sendResponse(false, 'Product not found');
        return;
    }
    
    // Map product_id to id for frontend compatibility
    $product = $result['data'][0];
    $product['id'] = $product['product_id'];
    
    // Return success response with product
    sendResponse(true, 'Product retrieved successfully', [
        'product' => $product
    ]);
}

/**
 * Create a new product
 */
function createProduct() {
    // Get product data from request
    $name = isset($_POST['name']) ? $_POST['name'] : '';
    $description = isset($_POST['description']) ? $_POST['description'] : '';
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
    $stock = isset($_POST['stock']) ? (int)$_POST['stock'] : 0;
    $category = isset($_POST['category']) ? $_POST['category'] : '';
    $image = isset($_POST['image']) ? $_POST['image'] : '';
    $barcode = isset($_POST['barcode']) ? $_POST['barcode'] : '';
    $serialNumber = isset($_POST['serial_number']) ? $_POST['serial_number'] : '';
    $manufacturer = isset($_POST['manufacter']) ? $_POST['manufacter'] : '';
    
    // Validate input
    if (empty($name)) {
        sendResponse(false, 'Product name is required');
        return;
    }
    
    if ($price < 0) {
        sendResponse(false, 'Price must be greater than or equal to 0');
        return;
    }
    
    if ($stock < 0) {
        sendResponse(false, 'Stock must be greater than or equal to 0');
        return;
    }
    
    // Create new product
    $query = "INSERT INTO Product (name, description, price, stock, category, image, barcode, serial_number, manufacter) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $params = [$name, $description, $price, $stock, $category, $image, $barcode, $serialNumber, $manufacturer];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Get new product ID
    $productId = $result['data']['insert_id'];
    
    // Return success response with product ID
    sendResponse(true, 'Product created successfully', [
        'id' => $productId
    ]);
}

/**
 * Update an existing product
 */
function updateProduct() {
    // Get product data from request
    $productId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    $name = isset($_POST['name']) ? $_POST['name'] : '';
    $description = isset($_POST['description']) ? $_POST['description'] : '';
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
    $stock = isset($_POST['stock']) ? (int)$_POST['stock'] : 0;
    $category = isset($_POST['category']) ? $_POST['category'] : '';
    $image = isset($_POST['image']) ? $_POST['image'] : '';
    $barcode = isset($_POST['barcode']) ? $_POST['barcode'] : '';
    $serialNumber = isset($_POST['serial_number']) ? $_POST['serial_number'] : '';
    $manufacturer = isset($_POST['manufacter']) ? $_POST['manufacter'] : '';
    
    // Validate input
    if ($productId <= 0) {
        sendResponse(false, 'Invalid product ID');
        return;
    }
    
    if (empty($name)) {
        sendResponse(false, 'Product name is required');
        return;
    }
    
    if ($price < 0) {
        sendResponse(false, 'Price must be greater than or equal to 0');
        return;
    }
    
    if ($stock < 0) {
        sendResponse(false, 'Stock must be greater than or equal to 0');
        return;
    }
    
    // Update product
    $query = "UPDATE Product SET name = ?, description = ?, price = ?, stock = ?, 
              category = ?, image = ?, barcode = ?, serial_number = ?, manufacter = ? 
              WHERE product_id = ?";
    $params = [$name, $description, $price, $stock, $category, $image, $barcode, $serialNumber, $manufacturer, $productId];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Check if product was updated
    if ($result['data']['affected_rows'] === 0) {
        sendResponse(false, 'Product not found');
        return;
    }
    
    // Return success response
    sendResponse(true, 'Product updated successfully');
}

/**
 * Delete a product
 */
function deleteProduct() {
    // Get product ID from request
    $productId = isset($_POST['id']) ? (int)$_POST['id'] : 0;
    
    // Validate input
    if ($productId <= 0) {
        sendResponse(false, 'Invalid product ID');
        return;
    }
    
    // Delete product
    $query = "DELETE FROM Product WHERE product_id = ?";
    $params = [$productId];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Check if product was deleted
    if ($result['data']['affected_rows'] === 0) {
        sendResponse(false, 'Product not found');
        return;
    }
    
    // Return success response
    sendResponse(true, 'Product deleted successfully');
}

/**
 * Send JSON response
 * 
 * @param bool $success Success status
 * @param string $message Message
 * @param array $data Response data
 */
function sendResponse($success, $message, $data = []) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    // Add data to response if available
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    
    // Send JSON response
    echo json_encode($response);
    exit;
}
?> 