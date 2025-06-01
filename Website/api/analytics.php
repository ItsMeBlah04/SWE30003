<?php
// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Database configuration
$db_file = __DIR__ . '/../shop.db'; // Absolute path to database

// Log file for debugging
$log_file = __DIR__ . '/analytics_debug.log';

// Simple logging function
function log_debug($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

log_debug("API request received: " . json_encode($_GET));

// Function to get database connection
function get_db_connection() {
    global $db_file;
    try {
        log_debug("Attempting to connect to database at: $db_file");
        
        // Check if file exists
        if (!file_exists($db_file)) {
            log_debug("Database file not found!");
            return null;
        }
        
        // Open SQLite database
        $db = new PDO('sqlite:' . $db_file);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        log_debug("Database connection successful");
        return $db;
    } catch (PDOException $e) {
        log_debug("Database connection error: " . $e->getMessage());
        return null;
    }
}

// Handle analytics data request
function get_analytics_data() {
    // Get filter parameters
    $month = isset($_GET['month']) ? $_GET['month'] : 'all';
    $year = isset($_GET['year']) ? $_GET['year'] : 'all';
    $category = isset($_GET['category']) ? $_GET['category'] : 'all';
    
    log_debug("Filters - Month: $month, Year: $year, Category: $category");
    
    // Connect to database
    $db = get_db_connection();
    if (!$db) {
        return [
            'success' => false,
            'message' => 'Database connection failed'
        ];
    }
    
    // Build filter conditions
    $conditions = [];
    $params = [];
    
    if ($month != 'all') {
        $conditions[] = "strftime('%m', o.Date) = ?";
        $params[] = str_pad($month, 2, '0', STR_PAD_LEFT);
    }
    
    if ($year != 'all') {
        $conditions[] = "strftime('%Y', o.Date) = ?";
        $params[] = $year;
    }
    
    if ($category != 'all') {
        $conditions[] = "p.Category LIKE ?";
        $params[] = "%$category%";
    }
    
    $where_clause = '';
    if (!empty($conditions)) {
        $where_clause = 'WHERE ' . implode(' AND ', $conditions);
    }
    
    log_debug("SQL where clause: $where_clause");
    
    try {
        // Calculate total revenue
        $query = "
            SELECT SUM(o.TotalAmount) as total_revenue
            FROM ORDERS o
            JOIN ORDERS_ITEM oi ON o.OrderID = oi.OrderID
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            $where_clause
        ";
        log_debug("Revenue query: $query");
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $total_revenue = $result && isset($result['total_revenue']) ? (float)$result['total_revenue'] : 0;
        log_debug("Total revenue: $total_revenue");
        
        // Get total orders
        $query = "
            SELECT COUNT(DISTINCT o.OrderID) as total_orders
            FROM ORDERS o
            JOIN ORDERS_ITEM oi ON o.OrderID = oi.OrderID
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            $where_clause
        ";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $total_orders = $result && isset($result['total_orders']) ? (int)$result['total_orders'] : 0;
        log_debug("Total orders: $total_orders");
        
        // Calculate average order value
        $avg_order = $total_orders > 0 ? $total_revenue / $total_orders : 0;
        
        // Get monthly sales data
        $monthly_sales = array_fill(0, 12, 0); // Initialize with zeros
        
        // Adjust where clause for monthly sales query
        $monthly_where_clause = str_replace('o.Date', 'Date', $where_clause);
        
        $query = "
            SELECT 
                strftime('%m', Date) as month,
                SUM(TotalAmount) as revenue
            FROM ORDERS o
            $monthly_where_clause
            GROUP BY month
            ORDER BY month
        ";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $month_idx = (int)$row['month'] - 1; // Convert to 0-based index
            $monthly_sales[$month_idx] = (float)$row['revenue'];
        }
        log_debug("Monthly sales data: " . json_encode($monthly_sales));
        
        // Get category distribution
        $query = "
            SELECT 
                p.Category,
                SUM(p.Price * oi.Quantity) as revenue
            FROM ORDERS_ITEM oi
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            JOIN ORDERS o ON oi.OrderID = o.OrderID
            $where_clause
            GROUP BY p.Category
            ORDER BY revenue DESC
        ";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        // Initialize categories
        $categories = [
            'phone' => 0,
            'tablet' => 0,
            'laptop' => 0,
            'watch' => 0,
            'accessories' => 0
        ];
        
        // Fill in category data
        $total_cat_revenue = 0;
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $category = $row['Category'] ? strtolower($row['Category']) : 'accessories';
            $revenue = $row['revenue'] ? (float)$row['revenue'] : 0;
            $total_cat_revenue += $revenue;
            
            // Map category to one of our predefined categories
            if (strpos($category, 'phone') !== false) {
                $categories['phone'] += $revenue;
            } elseif (strpos($category, 'tablet') !== false) {
                $categories['tablet'] += $revenue;
            } elseif (strpos($category, 'laptop') !== false) {
                $categories['laptop'] += $revenue;
            } elseif (strpos($category, 'watch') !== false) {
                $categories['watch'] += $revenue;
            } else {
                $categories['accessories'] += $revenue;
            }
        }
        
        // Calculate percentages
        if ($total_cat_revenue > 0) {
            foreach ($categories as $cat => $value) {
                $categories[$cat] = round(($value / $total_cat_revenue) * 100);
            }
        }
        log_debug("Category data: " . json_encode($categories));
        
        // Get top products
        $query = "
            SELECT 
                p.ProductID,
                p.Name,
                p.Category,
                SUM(oi.Quantity) as units,
                SUM(p.Price * oi.Quantity) as revenue
            FROM ORDERS_ITEM oi
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            JOIN ORDERS o ON oi.OrderID = o.OrderID
            $where_clause
            GROUP BY p.ProductID
            ORDER BY revenue DESC
            LIMIT 5
        ";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        $top_products = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $category = $row['Category'] ? strtolower($row['Category']) : 'accessories';
            
            // Map to simplified category
            $simple_category = 'accessories';
            if (strpos($category, 'phone') !== false) {
                $simple_category = 'phone';
            } elseif (strpos($category, 'tablet') !== false) {
                $simple_category = 'tablet';
            } elseif (strpos($category, 'laptop') !== false) {
                $simple_category = 'laptop';
            } elseif (strpos($category, 'watch') !== false) {
                $simple_category = 'watch';
            }
            
            $top_products[] = [
                'name' => $row['Name'],
                'category' => $simple_category,
                'units' => (int)$row['units'],
                'revenue' => (float)$row['revenue']
            ];
        }
        log_debug("Top products: " . json_encode($top_products));
        
        // Prepare response
        $response = [
            'success' => true,
            'stats' => [
                'totalRevenue' => round($total_revenue, 2),
                'totalOrders' => $total_orders,
                'averageOrder' => round($avg_order, 2),
                'conversionRate' => 3.2 // Hardcoded for now
            ],
            'monthlySales' => $monthly_sales,
            'categoryData' => $categories,
            'topProducts' => $top_products
        ];
        
        log_debug("Successful response prepared");
        return $response;
        
    } catch (PDOException $e) {
        log_debug("Database error: " . $e->getMessage());
        return [
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ];
    }
}

// Process the request
$response = get_analytics_data();
log_debug("Final response: " . json_encode($response));
echo json_encode($response);
?> 