CREATE TABLE PAYMENT (
  PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
  OrderID INTEGER,
  Method TEXT,
  Amount REAL,
  Date TEXT,
  Status TEXT
);

CREATE TABLE PRODUCT (
  ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT,
  Description TEXT,
  Price REAL,
  Stock INTEGER,
  Category TEXT,
  Image TEXT,
  Barcode TEXT,
  SerialNumber TEXT,
  Manufacter TEXT,
  AdminID INTEGER
);

CREATE TABLE ORDERS_ITEM (
  OrderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
  OrderID INTEGER,
  ProductID INTEGER,
  Quantity INTEGER,
  FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID)
);

CREATE TABLE INVOICE (
  InvoiceID INTEGER PRIMARY KEY AUTOINCREMENT,
  OrderID INTEGER,
  Date TEXT,
  Tax REAL,
  Total REAL
);

CREATE TABLE SHIPMENT (
  ShipmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  OrderID INTEGER,
  TrackingNumber TEXT,
  Status TEXT
);

CREATE TABLE DISCOUNT (
  DiscountID INTEGER PRIMARY KEY AUTOINCREMENT,
  Code TEXT,
  Rule TEXT,
  Percentage REAL
);

CREATE TABLE SALES_REPORT (
  ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
  AdminID INTEGER,
  StartDate TEXT,
  EndDate TEXT,
  DataSummary TEXT
);

CREATE TABLE CART (
  CartID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER,
  TotalAmount REAL
);

CREATE TABLE CUSTOMER (
  Customer_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT,
  Address TEXT,
  Phone TEXT,
  Email TEXT
);

CREATE TABLE AUTHENTICATOR (
  AuthenticatorID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER,
  AdminID INTEGER,
  UserName TEXT,
  PasswordHarsh TEXT
);

CREATE TABLE ADMIN (
  AdminID INTEGER PRIMARY KEY AUTOINCREMENT,
  Name TEXT,
  Email TEXT,
  Role TEXT
);

CREATE TABLE NOTIFICATION (
  NotificationID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER,
  Type TEXT,
  Content TEXT,
  Timestamp TEXT,
  FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(Customer_ID)
);

CREATE TABLE CART_ITEM (
  CartItemID INTEGER PRIMARY KEY AUTOINCREMENT,
  CartID INTEGER,
  ProductID INTEGER,
  Quantity INTEGER,
  FOREIGN KEY (CartID) REFERENCES CART(CartID),
  FOREIGN KEY (ProductID) REFERENCES PRODUCT(ProductID)
);

CREATE TABLE ORDERS (
  OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
  CustomerID INTEGER,
  Date TEXT,
  TotalAmount REAL,
  Status TEXT,
  FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(Customer_ID)
);

-- Create indexes for better performance
CREATE INDEX idx_product_name ON PRODUCT(Name);
CREATE INDEX idx_cart_customer ON CART(CustomerID);
CREATE INDEX idx_orders_customer ON ORDERS(CustomerID);
CREATE INDEX idx_orders_item_order ON ORDERS_ITEM(OrderID);
CREATE INDEX idx_cart_item_cart ON CART_ITEM(CartID);
CREATE INDEX idx_cart_item_product ON CART_ITEM(ProductID);

-- Insert default admin user (optional)
INSERT INTO ADMIN (AdminID, Name, Email, Role) 
VALUES (1, 'Admin', 'admin@example.com', 'Administrator');

-- Update the foreign key in ORDERS_ITEM to point to the correct column
-- Note: There might be an issue in the original schema where ProductID references PRODUCT(AdminID)
-- This has been corrected to reference PRODUCT(ProductID) in this SQLite version 