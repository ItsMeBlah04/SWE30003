<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Authentication API
 * 
 * Handles user authentication (login and signup)
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
        case 'login':
            handleLogin();
            break;
        case 'signup':
            handleSignup();
            break;
        case 'admin_login':
            handleAdminLogin();
            break;
        default:
            sendResponse(false, 'Invalid action');
    }
} else {
    // Only POST requests are allowed
    sendResponse(false, 'Invalid request method');
}

/**
 * Handle customer login
 */
function handleLogin() {
    // Get username and password from request
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validate input
    if (empty($username) || empty($password)) {
        sendResponse(false, 'Username and password are required');
        return;
    }
    
    // Find customer by joining authenticator and customer tables
    $query = "SELECT c.customer_id, c.name, c.email, auth.password_harsh 
              FROM customer c 
              JOIN authenticator auth ON c.customer_id = auth.customer_id 
              WHERE auth.username = ?";
    $params = [$username];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Check if customer exists
    if (count($result['data']) === 0) {
        sendResponse(false, 'Invalid username or password');
        return;
    }
    
    $customer = $result['data'][0];
    
    // Verify password using PHP's password_verify for bcrypt hashes
    if (!password_verify($password, $customer['password_harsh'])) {
        sendResponse(false, 'Invalid username or password');
        return;
    }
    
    // Return success response with customer data
    sendResponse(true, 'Login successful', [
        'customer_id' => $customer['customer_id'],
        'name' => $customer['name'],
        'email' => $customer['email']
    ]);
}

/**
 * Handle customer signup
 */
function handleSignup() {
    // Get customer data from request
    $firstName = isset($_POST['first_name']) ? $_POST['first_name'] : '';
    $lastName = isset($_POST['last_name']) ? $_POST['last_name'] : '';
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $phone = isset($_POST['phone']) ? $_POST['phone'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validate input
    if (empty($firstName) || empty($lastName) || empty($email) || empty($phone) || empty($password)) {
        sendResponse(false, 'All fields are required');
        return;
    }
    
    // Check if email already exists in customer table
    $query = "SELECT customer_id FROM Customer WHERE email = ?";
    $params = [$email];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    if (count($result['data']) > 0) {
        sendResponse(false, 'Email already exists');
        return;
    }
    
    // Check if username already exists in authenticator table
    $username = strtolower($firstName . substr($lastName, 0, 1)) . rand(1, 999); // Generate a username
    $query = "SELECT authenticator_id FROM authenticator WHERE username = ?";
    $params = [$username];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    if (count($result['data']) > 0) {
        // Username exists, try another one
        $username = strtolower($firstName . substr($lastName, 0, 2)) . rand(1000, 9999);
    }
    
    // Start a transaction
    $conn = getDbConnection();
    mysqli_begin_transaction($conn);
    
    try {
        // Create new customer
        $name = $firstName . ' ' . $lastName;
        $query = "INSERT INTO Customer (name, email, phone) VALUES (?, ?, ?)";
        $params = [$name, $email, $phone];
        
        $stmt = mysqli_prepare($conn, $query);
        
        if (!$stmt) {
            throw new Exception('Failed to prepare customer insert statement: ' . mysqli_error($conn));
        }
        
        mysqli_stmt_bind_param($stmt, 'sss', $name, $email, $phone);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception('Failed to execute customer insert: ' . mysqli_stmt_error($stmt));
        }
        
        $customerId = mysqli_insert_id($conn);
        mysqli_stmt_close($stmt);
        
        // Create authenticator entry
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $query = "INSERT INTO authenticator (customer_id, admin_id, username, password_harsh) VALUES (?, 0, ?, ?)";
        
        $stmt = mysqli_prepare($conn, $query);
        
        if (!$stmt) {
            throw new Exception('Failed to prepare authenticator insert statement: ' . mysqli_error($conn));
        }
        
        mysqli_stmt_bind_param($stmt, 'iss', $customerId, $username, $passwordHash);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception('Failed to execute authenticator insert: ' . mysqli_stmt_error($stmt));
        }
        
        mysqli_stmt_close($stmt);
        
        // Commit transaction
        mysqli_commit($conn);
        
        // Return success response with customer data
        sendResponse(true, 'Signup successful', [
            'customer_id' => $customerId,
            'name' => $name,
            'email' => $email,
            'username' => $username // Return generated username
        ]);
    } catch (Exception $e) {
        // Rollback transaction on error
        mysqli_rollback($conn);
        sendResponse(false, 'Error creating account: ' . $e->getMessage());
    } finally {
        closeDbConnection($conn);
    }
}

/**
 * Handle admin login
 */
function handleAdminLogin() {
    // Get username and password from request
    $username = isset($_POST['username']) ? $_POST['username'] : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
    // Validate input
    if (empty($username) || empty($password)) {
        sendResponse(false, 'Username and password are required');
        return;
    }
    
    // Debug: Log input
    error_log("Admin login attempt with username: $username");
    
    // Find admin authenticator and join with admin table
    $query = "SELECT a.admin_id, a.name, a.email, auth.password_harsh
              FROM authenticator auth
              JOIN admin a ON a.admin_id = auth.admin_id
              WHERE auth.username = ? AND auth.admin_id > 0";
    $params = [$username];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Check if admin exists
    if (count($result['data']) === 0) {
        sendResponse(false, 'Invalid username or password');
        return;
    }
    
    $admin = $result['data'][0];
    
    // Verify password
    // First try direct comparison (for unhashed passwords in the database)
    if ($password === $admin['password_harsh']) {
        // Return success response with admin data
        sendResponse(true, 'Login successful', [
            'admin_id' => $admin['admin_id'],
            'name' => $admin['name'],
            'email' => $admin['email']
        ]);
        return;
    }
    
    // Then try with password_verify (for hashed passwords)
    if (password_verify($password, $admin['password_harsh'])) {
        // Return success response with admin data
        sendResponse(true, 'Login successful', [
            'admin_id' => $admin['admin_id'],
            'name' => $admin['name'],
            'email' => $admin['email']
        ]);
        return;
    }
    
    // Password doesn't match
    sendResponse(false, 'Invalid username or password');
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