<?php
// Set the content type header to JSON
header('Content-Type: application/json');

require_once 'database_setup.php';
require_once 'query.php';

/**
 * Authenticator Class
 * Handles user authentication (both customers and admins)
 */
class Authenticator extends Query {
    
    /**
     * Initialize with database connection
     */
    public function __construct($conn) {
        parent::__construct($conn);
    }
    
    /**
     * Authenticate admin user
     * 
     * @param string $username Admin username
     * @param string $password Admin password
     * @return array|false Admin data if authenticated, false otherwise
     */
    public function authenticateAdmin($username, $password) {
        try {
            // Log attempt
            error_log("Attempting to authenticate admin: $username");
            
            // First check if the username exists in Authenticator table with admin_id
            $auth = $this->selectOne(
                "SELECT * FROM Authenticator WHERE username = ? AND admin_id IS NOT NULL AND admin_id > 0 LIMIT 1", 
                [$username]
            );
            
            if (!$auth) {
                error_log("Admin username not found or not linked to admin account: $username");
                return false;
            }
            
            // Log found user details (except password)
            $logDetails = $auth;
            unset($logDetails['password_harsh']);
            error_log("Found authenticator record: " . json_encode($logDetails));
            
            // Determine if we have password_harsh or just password in the table
            $passwordField = isset($auth['password_harsh']) ? 'password_harsh' : 'password';
            $storedHash = $auth[$passwordField];
            
            if (empty($storedHash)) {
                error_log("Empty password hash for admin: $username");
                return false;
            }
            
            // Try different authentication methods
            $authenticated = false;
            
            // Method 1: Check if the stored value is a valid hash and verify the password
            if (strlen($storedHash) >= 60 && strpos($storedHash, '$2y$') === 0) {
                // This is likely a bcrypt hash
                $authenticated = password_verify($password, $storedHash);
                if ($authenticated) {
                    error_log("Admin authenticated via bcrypt hash verification");
                }
            }
            
            // Method 2: Check if the stored value is an md5 hash
            if (!$authenticated && strlen($storedHash) === 32 && ctype_xdigit($storedHash)) {
                $authenticated = (md5($password) === $storedHash);
                if ($authenticated) {
                    error_log("Admin authenticated via md5 hash verification");
                }
            }
            
            // Method 3: Direct comparison (plain text password)
            if (!$authenticated && $password === $storedHash) {
                $authenticated = true;
                error_log("Admin authenticated via direct password comparison");
            }
            
            if ($authenticated) {
                // Get admin details
                $admin = $this->selectOne(
                    "SELECT * FROM Admin WHERE admin_id = ? LIMIT 1",
                    [$auth['admin_id']]
                );
                
                if (!$admin) {
                    error_log("Admin record not found for ID: " . $auth['admin_id']);
                    return false;
                }
                
                // Merge admin data with auth data
                $result = array_merge($auth, $admin);
                
                // Remove sensitive data
                unset($result['password_harsh'], $result['password']);
                
                return $result;
            }
            
            error_log("Invalid password for admin: $username");
            return false;
        } catch (Exception $e) {
            // Log error for debugging
            error_log("Authentication error: " . $e->getMessage());
            error_log("Exception trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Authenticate customer
     * 
     * @param string $username Customer username/email/phone
     * @param string $password Customer password
     * @return array|false Customer data if authenticated, false otherwise
     */
    public function authenticateCustomer($username, $password) {
        try {
            // Try to find customer by username in Authenticator table
            $auth = $this->selectOne(
                "SELECT a.authenticator_id, a.username, a.password_harsh, c.* 
                 FROM Authenticator a 
                 JOIN Customer c ON a.customer_id = c.customer_id 
                 WHERE a.username = ? LIMIT 1", 
                [$username]
            );
            
            // If not found by username, try email/phone in Customer table
            if (!$auth) {
                $customer = $this->selectOne(
                    "SELECT * FROM Customer WHERE (email = ? OR phone = ?) LIMIT 1", 
                    [$username, $username]
                );
                
                if (!$customer) {
                    return false;
                }
                
                // Get authenticator record for this customer
                $auth = $this->selectOne(
                    "SELECT * FROM Authenticator WHERE customer_id = ? LIMIT 1",
                    [$customer['customer_id']]
                );
                
                if (!$auth) {
                    return false;
                }
            }
            
            // Verify password
            if (password_verify($password, $auth['password_harsh'])) {
                // Combine customer and auth data (excluding password)
                $result = [
                    'id' => $auth['customer_id'],
                    'name' => $auth['name'] ?? ($auth['first_name'] . ' ' . $auth['last_name']),
                    'email' => $auth['email'],
                    'phone' => $auth['phone'] ?? ''
                ];
                
                return $result;
            }
            
            return false;
        } catch (Exception $e) {
            // Log error for debugging
            error_log("Customer authentication error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Register a new customer
     * 
     * @param array $data Customer data
     * @return array|false New customer data if registered, false otherwise
     */
    public function registerCustomer($data) {
        try {
            // Start transaction
            $this->conn->begin_transaction();
            
            // Check if email already exists
            $existingUser = $this->selectOne(
                "SELECT customer_id FROM Customer WHERE email = ? LIMIT 1", 
                [$data['email']]
            );
            
            if ($existingUser) {
                $this->conn->rollback();
                return false; // Email already registered
            }
            
            // Insert new customer
            $success = $this->execute(
                "INSERT INTO Customer (name, address, phone, email) 
                 VALUES (?, ?, ?, ?)",
                [
                    $data['first_name'] . ' ' . $data['last_name'],
                    $data['address'] ?? '',
                    $data['phone'] ?? '',
                    $data['email']
                ]
            );
            
            if (!$success) {
                $this->conn->rollback();
                return false;
            }
            
            // Get the new customer ID
            $customerId = $this->conn->insert_id;
            
            // Hash the password
            $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Create default admin ID (for system access)
            $adminId = 1; // Default admin ID
            
            // Create authenticator record
            $authSuccess = $this->execute(
                "INSERT INTO Authenticator (customer_id, admin_id, username, password_harsh) 
                 VALUES (?, ?, ?, ?)",
                [
                    $customerId,
                    $adminId,
                    $data['email'], // Use email as username
                    $passwordHash
                ]
            );
            
            if (!$authSuccess) {
                $this->conn->rollback();
                return false;
            }
            
            // Commit transaction
            $this->conn->commit();
            
            // Return the new customer data
            return [
                'customer_id' => $customerId,
                'name' => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? ''
            ];
        } catch (Exception $e) {
            // Rollback on error
            $this->conn->rollback();
            error_log("Registration error: " . $e->getMessage());
            return false;
        }
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Initialize database connection
        $configs = require_once 'settings.php';
        $database = new Database($configs);
        $conn = $database->getConnection();
        
        // Initialize authenticator
        $authenticator = new Authenticator($conn);
        
        // Get action from POST data
        $action = $_POST['action'] ?? '';
        
        // Handle different actions
        switch ($action) {
            case 'admin_login':
                // Get username and password from POST data
                $username = $_POST['username'] ?? '';
                $password = $_POST['password'] ?? '';
                
                // Log authentication attempt
                error_log("Admin login attempt for: $username");
                
                // Set content type header
                header('Content-Type: application/json');
                
                // Authenticate admin
                $admin = $authenticator->authenticateAdmin($username, $password);
                
                if ($admin) {
                    // Authentication successful
                    error_log("Admin authentication successful for: $username");
                    
                    // Log admin data for debugging
                    error_log("Admin data: " . json_encode($admin));
                    
                    echo json_encode([
                        'success' => true,
                        'admin_id' => $admin['admin_id'],
                        'name' => $admin['name'] ?? $admin['username'],
                        'email' => $admin['email'] ?? 'admin@electrik.com',
                        'username' => $admin['username']
                    ]);
                } else {
                    // Authentication failed
                    error_log("Admin authentication failed for: $username");
                    
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid username or password'
                    ]);
                }
                break;
            
            case 'login':
                // Get username and password from POST data
                $username = $_POST['username'] ?? '';
                $password = $_POST['password'] ?? '';
                
                // Authenticate customer
                $customer = $authenticator->authenticateCustomer($username, $password);
                
                if ($customer) {
                    // Authentication successful
                    echo json_encode([
                        'success' => true,
                        'customer_id' => $customer['id'] ?? $customer['customer_id'],
                        'name' => $customer['name'] ?? ($customer['first_name'] . ' ' . $customer['last_name']),
                        'email' => $customer['email'] ?? ''
                    ]);
                } else {
                    // Authentication failed
                    echo json_encode([
                        'success' => false,
                        'message' => 'Invalid username or password'
                    ]);
                }
                break;
            
            case 'signup':
                // Get customer data from POST
                $customerData = [
                    'first_name' => $_POST['first_name'] ?? '',
                    'last_name' => $_POST['last_name'] ?? '',
                    'email' => $_POST['email'] ?? '',
                    'phone' => $_POST['phone'] ?? '',
                    'password' => $_POST['password'] ?? ''
                ];
                
                // Validate required fields
                if (empty($customerData['first_name']) || empty($customerData['email']) || empty($customerData['password'])) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Missing required fields'
                    ]);
                    break;
                }
                
                // Register customer
                $newCustomer = $authenticator->registerCustomer($customerData);
                
                if ($newCustomer) {
                    // Registration successful
                    echo json_encode([
                        'success' => true,
                        'customer_id' => $newCustomer['customer_id'],
                        'name' => $newCustomer['name']
                    ]);
                } else {
                    // Registration failed
                    echo json_encode([
                        'success' => false,
                        'message' => 'Registration failed. Email may already be registered.'
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
    } catch (Exception $e) {
        // Send error response as JSON
        echo json_encode([
            'success' => false,
            'message' => 'Server error: ' . $e->getMessage()
        ]);
    }
} else {
    // Invalid request method
    echo json_encode([
        'success' => false,
        'message' => 'Only POST requests are allowed'
    ]);
}
?> 