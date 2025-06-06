CREATE TABLE Payment (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  method VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL
);

CREATE TABLE Product (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  category VARCHAR(50),
  image VARCHAR(255),
  barcode VARCHAR(100),
  serial_number VARCHAR(100),
  manufacter VARCHAR(100)
);

-- CREATE TABLE Orders_Item (
--   order_item_id INT PRIMARY KEY AUTO_INCREMENT,
--   order_id INT NOT NULL,
--   product_id INT NOT NULL REFERENCES Product(product_id),
--   quantity INT NOT NULL
-- );

CREATE TABLE Invoice (
  invoice_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  date DATETIME NOT NULL,
  tax INT,
  total DECIMAL(10,2)
);

CREATE TABLE Shipment (
  shipment_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  tracking_number VARCHAR(100),
  status VARCHAR(50)
);

CREATE TABLE Discount (
  discount_id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50),
  rule VARCHAR(255),
  percentage DECIMAL(5,2)
);

CREATE TABLE Sales_Report (
  report_id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL REFERENCES Admin(admin_id),
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  data_summary LONGBLOB
);

-- CREATE TABLE Cart (
--   cart_id INT PRIMARY KEY AUTO_INCREMENT,
--   customer_id INT NOT NULL,
--   total_amount DECIMAL(10,2)
-- );

CREATE TABLE Customer (
  customer_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  password_harsh VARCHAR(255)
);

-- CREATE TABLE Authenticator (
--   authenticator_id INT PRIMARY KEY AUTO_INCREMENT,
--   customer_id INT NOT NULL,
--   admin_id INT NOT NULL,
--   username VARCHAR(50),
--   password_harsh VARCHAR(255)
-- );

CREATE TABLE Admin (
  admin_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100),
  password_harsh VARCHAR(255)
);

-- CREATE TABLE Notification (
--   notification_id INT PRIMARY KEY AUTO_INCREMENT,
--   customer_id INT NOT NULL REFERENCES Customer(customer_id),
--   type VARCHAR(50),
--   content TEXT,
--   timestamp DATETIME NOT NULL
-- );

-- CREATE TABLE Cart_Item (
--   cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
--   cart_id INT NOT NULL REFERENCES Cart(cart_id),
--   product_id INT NOT NULL REFERENCES Product(product_id),
--   quantity INT NOT NULL
-- );

CREATE TABLE Orders (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL REFERENCES Customer(customer_id),
  date DATETIME NOT NULL,
  total_amount INT NOT NULL
);