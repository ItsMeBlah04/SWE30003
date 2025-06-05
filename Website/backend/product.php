<?php
    require_once 'query.php';

    class Product extends Query {

        public function __construct($conn) {
            parent::__construct($conn); // Initialize connection
        }

        public function getAllProducts() {
            return $this->select("SELECT * FROM product");
        }

        public function getProductById($id) {
            return $this->selectOne("SELECT * FROM product WHERE id = ?", [$id]);
        }

        public function addProduct($name, $price, $description, $stock, $category, $image, $barcode, $serialNumber, $manufacturer) {
            return $this->execute(
                "INSERT INTO product (name, price, description, stock, category, image, barcode, serial_number, manufacturer)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [$name, $price, $description, $stock, $category, $image, $barcode, $serialNumber, $manufacturer]
            );
        }

        public function deleteProductById($id) {
            return $this->execute("DELETE FROM product WHERE id = ?", [$id]);
        }

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

            $sql = "UPDATE product SET " . implode(', ', $setParts) . " WHERE id = ?";
            $params[] = $id; 

            return $this->execute($sql, $params);
        }
    }
?>