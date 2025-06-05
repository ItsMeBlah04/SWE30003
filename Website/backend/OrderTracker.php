<?php
require_once 'query.php';

class OrderTracker extends Query {

    /**
     * Get shipment details by Order ID
     *
     * @param string $orderId
     * @return array|null
     */
    public function getByOrderId($orderId) {
        $sql = "
            SELECT s.tracking_number, s.status, o.customer_id, o.order_id
            FROM shipment s
            JOIN orders o ON s.order_id = o.order_id
            WHERE s.order_id = ?
        ";
        return $this->selectOne($sql, [$orderId]);
    }

    /**
     * Get all matching shipments by customer name and either email or phone
     *
     * @param string $name
     * @param string $email
     * @param string $phone
     * @return array
     */
    public function getByNameAndContact($name, $email = '', $phone = '') {
        $sql = "
            SELECT s.tracking_number, s.status, o.customer_id, o.order_id
            FROM shipment s
            JOIN orders o ON s.order_id = o.order_id
            JOIN customer c ON o.customer_id = c.customer_id
            WHERE c.name = ?
        ";

        $params = [$name];

        if (!empty($email) && !empty($phone)) {
            $sql .= " AND (c.email = ? OR c.phone = ?)";
            $params[] = $email;
            $params[] = $phone;
        } elseif (!empty($email)) {
            $sql .= " AND c.email = ?";
            $params[] = $email;
        } elseif (!empty($phone)) {
            $sql .= " AND c.phone = ?";
            $params[] = $phone;
        }

        $sql .= " ORDER BY o.date DESC";
        return $this->select($sql, $params);
    }

    /**
     * Send a notification for the given customer
     *
     * @param string $customerId
     * @param string $type
     * @param string $content
     * @return bool
     */
    public function sendNotification($customerId, $type, $content) {
        $sql = "INSERT INTO notification (customer_id, type, content, timestamp)
                VALUES (?, ?, ?, NOW())";
        return $this->execute($sql, [$customerId, $type, $content]);
    }

    /**
     * Update shipment status by order ID
     *
     * @param string $orderId
     * @param string $status
     * @return bool
     */
    public function updateShipmentStatus($orderId, $status) {
        $sql = "UPDATE shipment SET status = ? WHERE order_id = ?";
        return $this->update($sql, [$status, $orderId]);
    }
}
