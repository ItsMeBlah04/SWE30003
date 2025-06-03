<?php
require_once 'database_setup.php';
require_once 'query.php';

/**
 * Product Class
 * Handles database operations for products
 */
class Product extends Query {

    /**
     * Initialize with database connection
     */
    public function __construct($conn) {
        parent::__construct($conn); // Initialize connection
    }

    /**
     * Get all products from the database
     * 
     * @return array Array of all products
     */
    public function getAllProducts() {
        return $this->select("SELECT * FROM Product");
    }

    /**
     * Get a product by its ID
     * 
     * @param int $id Product ID
     * @return array|null Product data or null if not found
     */
    public function getProductById($id) {
        return $this->selectOne("SELECT * FROM Product WHERE product_id = ?", [$id]);
    }

    /**
     * Add a new product to the database
     * 
     * @param string $name Product name
     * @param float $price Product price
     * @param string $description Product description
     * @param int $stock Product stock quantity
     * @param string $category Product category
     * @param string $image Product image URL
     * @param string $barcode Product barcode
     * @param string $serialNumber Product serial number
     * @param string $manufacturer Product manufacturer
     * @return bool True on success, false on failure
     */
    public function addProduct($name, $price, $description, $stock, $category, $image, $barcode, $serialNumber, $manufacturer) {
        return $this->execute(
            "INSERT INTO Product (name, price, description, stock, category, image, barcode, serial_number, manufacter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [$name, $price, $description, $stock, $category, $image, $barcode, $serialNumber, $manufacturer]
        );
    }

    /**
     * Delete a product by its ID
     * 
     * @param int $id Product ID
     * @return bool True on success, false on failure
     */
    public function deleteProductById($id) {
        return $this->execute("DELETE FROM Product WHERE product_id = ?", [$id]);
    }

    /**
     * Update product fields by ID
     * 
     * @param int $id Product ID
     * @param array $fields Associative array of fields to update
     * @return bool True on success, false on failure
     */
    public function updateProductByFields($id, $fields) {
        if (empty($fields)) {
            return false; 
        }

        $setParts = [];
        $params = [];

        foreach ($fields as $column => $value) {
            $setParts[] = "`$column` = ?";
            $params[] = $value;
        }

        $sql = "UPDATE Product SET " . implode(', ', $setParts) . " WHERE product_id = ?";
        $params[] = $id; 

        return $this->execute($sql, $params);
    }
}

// Handle API requests if this file is accessed directly
if (basename($_SERVER['SCRIPT_FILENAME']) == basename(__FILE__)) {
    // Only handle POST requests
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Initialize database connection
        $configs = require_once 'settings.php';
        $database = new Database($configs);
        $conn = $database->getConnection();
        
        // Initialize product handler
        $product = new Product($conn);
        
        // Get action from POST data
        $action = $_POST['action'] ?? '';
        
        // Handle different actions
        switch ($action) {
            case 'get_all':
                // Get all products
                $products = $product->getAllProducts();
                
                // Return products as JSON
                echo json_encode([
                    'success' => true,
                    'products' => $products
                ]);
                break;
                
            case 'get_product':
                // Get product ID from POST data
                $id = $_POST['id'] ?? 0;
                
                if (empty($id)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Product ID is required'
                    ]);
                    break;
                }
                
                // Get product by ID
                $productData = $product->getProductById($id);
                
                if ($productData) {
                    // Return product as JSON
                    echo json_encode([
                        'success' => true,
                        'product' => $productData
                    ]);
                } else {
                    // Product not found
                    echo json_encode([
                        'success' => false,
                        'message' => 'Product not found'
                    ]);
                }
                break;
                
            case 'create':
                // Get product data from POST
                $name = $_POST['name'] ?? '';
                $price = $_POST['price'] ?? 0;
                $description = $_POST['description'] ?? '';
                $stock = $_POST['stock'] ?? 0;
                $category = $_POST['category'] ?? '';
                $image = $_POST['image'] ?? '';
                $barcode = $_POST['barcode'] ?? '';
                $serialNumber = $_POST['serialNumber'] ?? '';
                $manufacturer = $_POST['manufacturer'] ?? '';
                
                // Validate required fields
                if (empty($name) || empty($category)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Name and category are required'
                    ]);
                    break;
                }
                
                // Add product
                $result = $product->addProduct(
                    $name, 
                    $price, 
                    $description, 
                    $stock, 
                    $category, 
                    $image, 
                    $barcode, 
                    $serialNumber, 
                    $manufacturer
                );
                
                if ($result) {
                    // Get the new product ID
                    $newProductId = $conn->insert_id;
                    
                    // Return success
                    echo json_encode([
                        'success' => true,
                        'message' => 'Product created successfully',
                        'id' => $newProductId
                    ]);
                } else {
                    // Failed to create product
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to create product'
                    ]);
                }
                break;
                
            case 'update':
                // Get product ID from POST data
                $id = $_POST['id'] ?? 0;
                
                if (empty($id)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Product ID is required'
                    ]);
                    break;
                }
                
                // Prepare fields to update
                $fields = [];
                
                // Only update fields that are present in the request
                if (isset($_POST['name'])) {
                    $fields['name'] = $_POST['name'];
                }
                
                if (isset($_POST['price'])) {
                    $fields['price'] = $_POST['price'];
                }
                
                if (isset($_POST['description'])) {
                    $fields['description'] = $_POST['description'];
                }
                
                if (isset($_POST['stock'])) {
                    $fields['stock'] = $_POST['stock'];
                }
                
                if (isset($_POST['category'])) {
                    $fields['category'] = $_POST['category'];
                }
                
                if (isset($_POST['image'])) {
                    $fields['image'] = $_POST['image'];
                }
                
                if (isset($_POST['barcode'])) {
                    $fields['barcode'] = $_POST['barcode'];
                }
                
                if (isset($_POST['serialNumber'])) {
                    $fields['serial_number'] = $_POST['serialNumber'];
                }
                
                if (isset($_POST['manufacturer'])) {
                    $fields['manufacturer'] = $_POST['manufacturer'];
                }
                
                // Update product
                $result = $product->updateProductByFields($id, $fields);
                
                if ($result) {
                    // Return success
                    echo json_encode([
                        'success' => true,
                        'message' => 'Product updated successfully'
                    ]);
                } else {
                    // Failed to update product
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to update product'
                    ]);
                }
                break;
                
            case 'delete':
                // Get product ID from POST data
                $id = $_POST['id'] ?? 0;
                
                if (empty($id)) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Product ID is required'
                    ]);
                    break;
                }
                
                // Delete product
                $result = $product->deleteProductById($id);
                
                if ($result) {
                    // Return success
                    echo json_encode([
                        'success' => true,
                        'message' => 'Product deleted successfully'
                    ]);
                } else {
                    // Failed to delete product
                    echo json_encode([
                        'success' => false,
                        'message' => 'Failed to delete product'
                    ]);
                }
                break;
                
            default:
                // Invalid action
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid action'
                ]);
                break;
        }
        
        // Close database connection
        $conn->close();
    } else {
        // Only POST requests are allowed
        header('HTTP/1.1 405 Method Not Allowed');
        echo json_encode([
            'success' => false,
            'message' => 'Only POST requests are allowed'
        ]);
    }
}
?>