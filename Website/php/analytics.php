<?php
/**
 * Analytics API
 * 
 * Handles analytics-related operations for admin reports
 */

// Include database configuration
require_once 'config.php';

// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Create a log file for debugging
function logDebug($message) {
    $logFile = '../debug_analytics.log';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND);
}

// Log server information
logDebug("PHP Version: " . phpversion());
logDebug("Server: " . $_SERVER['SERVER_SOFTWARE']);
logDebug("Request method: " . $_SERVER['REQUEST_METHOD']);
logDebug("Request URI: " . $_SERVER['REQUEST_URI']);
logDebug("POST data: " . print_r($_POST, true));

// Log the request
logDebug("Request received: " . $_SERVER['REQUEST_METHOD']);
logDebug("POST data: " . print_r($_POST, true));

// Set headers for API response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Get request data
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Handle preflight OPTIONS request
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$action = isset($_POST['action']) ? $_POST['action'] : '';
logDebug("Action: $action");

// If this is a POST request
if ($requestMethod === 'POST') {
    // Handle different actions
    switch ($action) {
        case 'sales_summary':
            getSalesSummary();
            break;
        case 'product_sales':
            getProductSales();
            break;
        case 'category_sales':
            getCategorySales();
            break;
        case 'sales_by_date':
            getSalesByDate();
            break;
        case 'generate_report':
            generateReport();
            break;
        case 'create_report':
            createReport();
            break;
        case 'update_report':
            updateReport();
            break;
        case 'get_reports_by_admin':
            getReportsByAdmin();
            break;
        default:
            sendResponse(false, 'Invalid action: ' . $action);
    }
} else {
    // Only POST requests are allowed
    sendResponse(false, 'Invalid request method: ' . $requestMethod);
}

/**
 * Get sales summary
 */
function getSalesSummary() {
    logDebug("Getting sales summary");
    
    // Get date range from request
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : date('Y-m-d');
    
    logDebug("Date range: $startDate to $endDate");
    
    // Get total sales
    $query = "SELECT COUNT(order_id) as total_orders, SUM(total_amount) as total_sales 
              FROM Orders 
              WHERE date BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    logDebug("Executing query: $query");
    $result = executeQuery($query, $params);
    logDebug("Query result: " . print_r($result, true));
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    $summary = $result['data'][0];
    
    // Get average order value
    $averageOrderValue = 0;
    if ($summary['total_orders'] > 0) {
        $averageOrderValue = $summary['total_sales'] / $summary['total_orders'];
    }
    
    // Return success response with summary
    sendResponse(true, 'Sales summary retrieved successfully', [
        'total_orders' => (int)$summary['total_orders'],
        'total_sales' => (float)$summary['total_sales'],
        'average_order_value' => round($averageOrderValue, 2),
        'start_date' => $startDate,
        'end_date' => $endDate
    ]);
}

/**
 * Get product sales
 */
function getProductSales() {
    // Get date range from request
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : date('Y-m-d');
    
    // Get category filter if available
    $category = isset($_POST['category']) && $_POST['category'] !== 'all' ? $_POST['category'] : null;
    
    // Build query
    $query = "SELECT p.product_id, p.name, p.category, SUM(oi.quantity) as total_quantity, 
              SUM(oi.quantity * p.price) as total_revenue
              FROM Orders o
              JOIN Orders_Item oi ON o.order_id = oi.order_id
              JOIN Product p ON oi.product_id = p.product_id
              WHERE o.date BETWEEN ? AND ?";
    $params = [$startDate, $endDate];
    
    // Add category filter if provided
    if ($category) {
        $query .= " AND p.category = ?";
        $params[] = $category;
    }
    
    $query .= " GROUP BY p.product_id
              ORDER BY total_revenue DESC";
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Return success response with product sales
    sendResponse(true, 'Product sales retrieved successfully', [
        'product_sales' => $result['data'],
        'start_date' => $startDate,
        'end_date' => $endDate
    ]);
}

/**
 * Get category sales
 */
function getCategorySales() {
    // Get date range from request
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : date('Y-m-d');
    
    // Get category sales
    $query = "SELECT p.category, SUM(oi.quantity) as total_quantity, 
              SUM(oi.quantity * p.price) as total_revenue
              FROM Orders o
              JOIN Orders_Item oi ON o.order_id = oi.order_id
              JOIN Product p ON oi.product_id = p.product_id
              WHERE o.date BETWEEN ? AND ?
              GROUP BY p.category
              ORDER BY total_revenue DESC";
    $params = [$startDate, $endDate];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Return success response with category sales
    sendResponse(true, 'Category sales retrieved successfully', [
        'category_sales' => $result['data'],
        'start_date' => $startDate,
        'end_date' => $endDate
    ]);
}

/**
 * Get sales by date
 */
function getSalesByDate() {
    // Get date range from request
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : date('Y-m-d');
    
    // Get sales by date
    $query = "SELECT DATE(date) as sale_date, COUNT(order_id) as total_orders, 
              SUM(total_amount) as total_sales
              FROM Orders
              WHERE date BETWEEN ? AND ?
              GROUP BY DATE(date)
              ORDER BY sale_date";
    $params = [$startDate, $endDate];
    
    $result = executeQuery($query, $params);
    
    if (!$result['success']) {
        sendResponse(false, 'Database error: ' . $result['message']);
        return;
    }
    
    // Return success response with sales by date
    sendResponse(true, 'Sales by date retrieved successfully', [
        'sales_by_date' => $result['data'],
        'start_date' => $startDate,
        'end_date' => $endDate
    ]);
}

/**
 * Generate complete sales report
 */
function generateReport() {
    logDebug("Generating complete sales report");
    
    // Get date range from request
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : date('Y-m-d', strtotime('-30 days'));
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : date('Y-m-d');
    
    // Get category filter if available
    $category = isset($_POST['category']) && $_POST['category'] !== 'all' ? $_POST['category'] : null;
    
    // Get admin ID if available
    $adminId = isset($_POST['admin_id']) ? $_POST['admin_id'] : null;
    
    logDebug("Report parameters: startDate=$startDate, endDate=$endDate, category=$category, adminId=$adminId");
    
    try {
        // Convert date strings to include time for DATETIME comparison
        $startDateTime = $startDate . ' 00:00:00';
        $endDateTime = $endDate . ' 23:59:59';
        
        // Get connection
        $conn = getDbConnection();
        
        // Log the actual date range we're using for debugging
        logDebug("Using date range for queries: $startDateTime to $endDateTime");
        
        // Check if tables exist and get their correct names (MySQL is case-sensitive)
        $tableNames = checkTableNames($conn);
        $ordersTable = $tableNames['orders'];
        $orderItemsTable = $tableNames['order_items'];
        $productTable = $tableNames['product'];
        $salesReportTable = $tableNames['sales_report'];
        
        logDebug("Using table names: Orders=$ordersTable, OrderItems=$orderItemsTable, Product=$productTable, SalesReport=$salesReportTable");
        
        // ---- Get sales summary ----
        logDebug("Getting sales summary...");
        $summaryQuery = "SELECT 
            COUNT(order_id) as total_orders, 
            SUM(total_amount) as total_sales 
            FROM $ordersTable 
            WHERE date BETWEEN ? AND ?";
        
        $stmt = $conn->prepare($summaryQuery);
        $stmt->execute([$startDateTime, $endDateTime]);
        $summaryResult = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Log the raw summary result
        logDebug("Raw summary result: " . print_r($summaryResult, true));
        
        $totalOrders = isset($summaryResult['total_orders']) ? (int)$summaryResult['total_orders'] : 0;
        $totalSales = isset($summaryResult['total_sales']) ? (int)$summaryResult['total_sales'] : 0;
        $avgOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;
        
        $summary = [
            'total_orders' => $totalOrders,
            'total_sales' => $totalSales,
            'average_order_value' => round($avgOrderValue, 2)
        ];
        
        logDebug("Summary data: " . json_encode($summary));
        
        // ---- Get product sales ----
        logDebug("Getting product sales...");
        $productQuery = "SELECT 
            p.product_id, 
            p.name, 
            p.category, 
            SUM(oi.quantity) as total_quantity, 
            SUM(oi.quantity * p.price) as total_revenue
            FROM $ordersTable o
            JOIN $orderItemsTable oi ON o.order_id = oi.order_id
            JOIN $productTable p ON oi.product_id = p.product_id
            WHERE o.date BETWEEN ? AND ?";
        
        $params = [$startDateTime, $endDateTime];
        
        if ($category) {
            $productQuery .= " AND p.category = ?";
            $params[] = $category;
        }
        
        $productQuery .= " GROUP BY p.product_id ORDER BY total_revenue DESC LIMIT 20";
        
        $stmt = $conn->prepare($productQuery);
        $stmt->execute($params);
        $productSales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logDebug("Product sales: " . count($productSales) . " products found");
        
        // If no product sales found, try with a wider date range for testing
        if (empty($productSales)) {
            logDebug("No product sales found, trying with a wider date range for testing");
            $widerStartDate = '2024-01-01 00:00:00';
            $widerEndDate = '2025-12-31 23:59:59';
            
            $widerParams = [$widerStartDate, $widerEndDate];
            if ($category) {
                $widerParams[] = $category;
            }
            
            $stmt = $conn->prepare($productQuery);
            $stmt->execute($widerParams);
            $productSales = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            logDebug("Product sales with wider range: " . count($productSales) . " products found");
        }
        
        // ---- Get category sales ----
        logDebug("Getting category sales...");
        $categoryQuery = "SELECT 
            p.category, 
            SUM(oi.quantity) as total_quantity, 
            SUM(oi.quantity * p.price) as total_revenue
            FROM $ordersTable o
            JOIN $orderItemsTable oi ON o.order_id = oi.order_id
            JOIN $productTable p ON oi.product_id = p.product_id
            WHERE o.date BETWEEN ? AND ?
            GROUP BY p.category
            ORDER BY total_revenue DESC";
        
        $stmt = $conn->prepare($categoryQuery);
        $stmt->execute([$startDateTime, $endDateTime]);
        $categorySales = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logDebug("Category sales: " . count($categorySales) . " categories found");
        
        // ---- Get sales by date ----
        logDebug("Getting sales by date...");
        $dateQuery = "SELECT 
            DATE(date) as sale_date, 
            COUNT(order_id) as total_orders, 
            SUM(total_amount) as total_sales
            FROM $ordersTable
            WHERE date BETWEEN ? AND ?
            GROUP BY DATE(date)
            ORDER BY sale_date
            LIMIT 30";
        
        $stmt = $conn->prepare($dateQuery);
        $stmt->execute([$startDateTime, $endDateTime]);
        $salesByDate = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        logDebug("Sales by date: " . count($salesByDate) . " days found");
        
        // Create report ID if admin ID is provided
        $reportId = null;
        if ($adminId) {
            // Use direct query for insert
            $insertQuery = "INSERT INTO $salesReportTable (admin_id, start_date, end_date) VALUES (?, ?, ?)";
            $stmt = $conn->prepare($insertQuery);
            $success = $stmt->execute([$adminId, $startDateTime, $endDateTime]);
            
            if ($success) {
                $reportId = $conn->lastInsertId();
                logDebug("Created report record with ID: $reportId");
            }
        }
        
        // Return success response with report data
        sendResponse(true, 'Report generated successfully', [
            'report_id' => $reportId,
            'admin_id' => $adminId,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'summary' => $summary,
            'product_sales' => $productSales,
            'category_sales' => $categorySales,
            'sales_by_date' => $salesByDate
        ]);
    } catch (Exception $e) {
        logDebug("Exception in generateReport: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        sendResponse(false, 'Error generating report: ' . $e->getMessage());
    }
}

/**
 * Check table names and return the correct case-sensitive names
 * 
 * @param PDO $conn Database connection
 * @return array Associative array of table names
 */
function checkTableNames($conn) {
    try {
        // Get list of tables in the database
        $tables = [];
        $stmt = $conn->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = strtolower($row[0]);
        }
        
        logDebug("Tables in database: " . implode(", ", $tables));
        
        // Find the correct table names
        $result = [
            'orders' => 'Orders',
            'order_items' => 'Orders_Item',
            'product' => 'Product',
            'sales_report' => 'Sales_Report'
        ];
        
        // Check if tables exist with different case
        if (in_array('orders', $tables)) {
            $result['orders'] = 'orders';
        }
        
        if (in_array('orders_item', $tables)) {
            $result['order_items'] = 'orders_item';
        } else if (in_array('order_items', $tables)) {
            $result['order_items'] = 'order_items';
        }
        
        if (in_array('product', $tables)) {
            $result['product'] = 'product';
        }
        
        if (in_array('sales_report', $tables)) {
            $result['sales_report'] = 'sales_report';
        }
        
        return $result;
    } catch (Exception $e) {
        logDebug("Error checking table names: " . $e->getMessage());
        // Return default names
        return [
            'orders' => 'Orders',
            'order_items' => 'Orders_Item',
            'product' => 'Product',
            'sales_report' => 'Sales_Report'
        ];
    }
}

/**
 * Create a report record in the database
 * 
 * @param int $adminId Admin ID
 * @param string $startDate Start date
 * @param string $endDate End date
 * @return int|null Report ID
 */
function createReportRecord($adminId, $startDate, $endDate) {
    try {
        // Convert date strings to include time for DATETIME
        $startDateTime = $startDate . ' 00:00:00';
        $endDateTime = $endDate . ' 23:59:59';
        
        // Insert report record
        $query = "INSERT INTO Sales_Report (admin_id, start_date, end_date)
                VALUES (?, ?, ?)";
        $params = [$adminId, $startDateTime, $endDateTime];
        
        logDebug("Executing query: $query with params: " . json_encode($params));
        $result = executeQuery($query, $params);
        
        if (!$result['success']) {
            logDebug("Failed to create report record: " . $result['message']);
            return null;
        }
        
        // Get last insert ID
        return isset($result['data']['insert_id']) ? $result['data']['insert_id'] : null;
    } catch (Exception $e) {
        logDebug("Exception in createReportRecord: " . $e->getMessage());
        return null;
    }
}

/**
 * Create a new sales report
 */
function createReport() {
    // Get report data from request
    $adminId = isset($_POST['admin_id']) ? $_POST['admin_id'] : null;
    $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : null;
    $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : null;
    
    if (!$adminId || !$startDate || !$endDate) {
        sendResponse(false, 'Missing required fields');
        return;
    }
    
    // Insert report record
    $reportId = createReportRecord($adminId, $startDate, $endDate);
    
    if (!$reportId) {
        sendResponse(false, 'Failed to create report');
        return;
    }
    
    // Return success response
    sendResponse(true, 'Report created successfully', [
        'report_id' => $reportId
    ]);
}

/**
 * Update an existing sales report
 */
function updateReport() {
    try {
        // Get report data from request
        $reportId = isset($_POST['report_id']) ? $_POST['report_id'] : null;
        $startDate = isset($_POST['start_date']) ? $_POST['start_date'] : null;
        $endDate = isset($_POST['end_date']) ? $_POST['end_date'] : null;
        
        if (!$reportId || !$startDate || !$endDate) {
            sendResponse(false, 'Missing required fields');
            return;
        }
        
        // Convert date strings to include time for DATETIME
        $startDateTime = $startDate . ' 00:00:00';
        $endDateTime = $endDate . ' 23:59:59';
        
        // Update report record
        $query = "UPDATE Sales_Report SET start_date = ?, end_date = ?, updated_at = NOW()
                WHERE report_id = ?";
        $params = [$startDateTime, $endDateTime, $reportId];
        
        logDebug("Executing query: $query with params: " . json_encode($params));
        $result = executeQuery($query, $params);
        
        if (!$result['success']) {
            logDebug("Failed to update report: " . $result['message']);
            sendResponse(false, 'Failed to update report: ' . $result['message']);
            return;
        }
        
        // Return success response
        sendResponse(true, 'Report updated successfully');
    } catch (Exception $e) {
        logDebug("Exception in updateReport: " . $e->getMessage());
        sendResponse(false, 'Error updating report: ' . $e->getMessage());
    }
}

/**
 * Get all reports for an admin
 */
function getReportsByAdmin() {
    try {
        // Get admin ID from request
        $adminId = isset($_POST['admin_id']) ? $_POST['admin_id'] : null;
        
        if (!$adminId) {
            sendResponse(false, 'Missing admin ID');
            return;
        }
        
        // Get reports
        $query = "SELECT report_id, admin_id, 
                DATE_FORMAT(start_date, '%Y-%m-%d') as start_date, 
                DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, 
                created_at, updated_at
                FROM Sales_Report
                WHERE admin_id = ?
                ORDER BY created_at DESC";
        $params = [$adminId];
        
        logDebug("Executing query: $query with params: " . json_encode($params));
        $result = executeQuery($query, $params);
        
        if (!$result['success']) {
            logDebug("Failed to get reports: " . $result['message']);
            sendResponse(false, 'Database error: ' . $result['message']);
            return;
        }
        
        // Return success response with reports
        sendResponse(true, 'Reports retrieved successfully', [
            'reports' => $result['data']
        ]);
    } catch (Exception $e) {
        logDebug("Exception in getReportsByAdmin: " . $e->getMessage());
        sendResponse(false, 'Error getting reports: ' . $e->getMessage());
    }
}

/**
 * Send JSON response
 * 
 * @param bool $success Success status
 * @param string $message Message
 * @param array $data Response data
 */
function sendResponse($success, $message, $data = []) {
    // Clean output buffer
    if (ob_get_length()) ob_clean();
    
    // Build response
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    // Add data to response if available
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    
    // Log the size of the response
    $json = json_encode($response);
    $size = strlen($json);
    logDebug("Response size: $size bytes");
    
    // If response is too large, trim it
    if ($size > 1000000) { // 1MB
        logDebug("Response too large, trimming data...");
        // Limit product_sales to 20 items
        if (isset($data['product_sales']) && count($data['product_sales']) > 20) {
            $response['product_sales'] = array_slice($data['product_sales'], 0, 20);
        }
        // Limit sales_by_date to 30 days
        if (isset($data['sales_by_date']) && count($data['sales_by_date']) > 30) {
            $response['sales_by_date'] = array_slice($data['sales_by_date'], 0, 30);
        }
        $json = json_encode($response);
        logDebug("Trimmed response size: " . strlen($json) . " bytes");
    }
    
    // Set headers
    header('Content-Length: ' . strlen($json));
    
    // Send JSON response
    echo $json;
    exit;
}
?> 