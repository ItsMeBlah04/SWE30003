CREATE TABLE `PAYMENT` (
  `PaymentID` int,
  `OrderID` int,
  `Method` varchar,
  `Amount` decimal,
  `Date` datetime,
  `Status` varchar,
  PRIMARY KEY (`PaymentID`)
);

CREATE TABLE `PRODUCT` (
  `ProductID` int,
  `Name` varchar,
  `Description` text,
  `Price` decimal,
  `Stock` int,
  `Category` varchar,
  `Image` varchar,
  `Barcode` varchar,
  `SerialNumber` varchar,
  `Manufacter` varchar,
  `AdminID` int,
  PRIMARY KEY (`ProductID`)
);

CREATE TABLE `ORDERS_ITEM` (
  `OrderItemID` int,
  `OrderID` int,
  `ProductID` int,
  `Quantity` int,
  PRIMARY KEY (`OrderItemID`),
  FOREIGN KEY (`ProductID`) REFERENCES `PRODUCT`(`AdminID`)
);

CREATE TABLE `INVOICE` (
  `InvoiceID` int,
  `OrderID` int,
  `Date` datetime,
  `Tax` decimal,
  `Total` decimal,
  PRIMARY KEY (`InvoiceID`)
);

CREATE TABLE `SHIPMENT` (
  `ShipmentID` int,
  `OrderID` int,
  `TrackingNumber` varchar,
  `Status` varchar,
  PRIMARY KEY (`ShipmentID`)
);

CREATE TABLE `DISCOUNT` (
  `DiscountID` int,
  `Code` varchar,
  `Rule` varchar,
  `Percentage` decimal,
  PRIMARY KEY (`DiscountID`)
);

CREATE TABLE `SALES_REPORT` (
  `ReportID` int,
  `AdminID` int,
  `StartDate` datetime,
  `EndDate` datetime,
  `DataSummary` text,
  PRIMARY KEY (`ReportID`)
);

CREATE TABLE `CART` (
  `CartID` int,
  `CustomerID` int,
  `TotalAmount` decimal,
  PRIMARY KEY (`CartID`)
);

CREATE TABLE `CUSTOMER` (
  `Customer_ID` int,
  `Name` varchar,
  `Address` varchar,
  `Phone` varchar,
  `Email` varchar,
  PRIMARY KEY (`Customer_ID`)
);

CREATE TABLE `AUTHENTICATOR` (
  `AuthenticatorID` int,
  `CustomerID` int,
  `AdminID` int,
  `UserName` varchar,
  `PasswordHarsh` varchar,
  PRIMARY KEY (`AuthenticatorID`)
);

CREATE TABLE `ADMIN` (
  `AdminID` int,
  `Name` varchar,
  `Email` varchar,
  `Role` varchar,
  PRIMARY KEY (`AdminID`)
);

CREATE TABLE `NOTIFICATION` (
  `NotificationID` int,
  `CustomerID` int,
  `Type` varchar,
  `Content` text,
  `Timestamp` datetime,
  PRIMARY KEY (`NotificationID`),
  FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`Customer_ID`)
);

CREATE TABLE `CART_ITEM` (
  `CartItemID` int,
  `CartID` int,
  `ProductID` int,
  `Quantity` int,
  PRIMARY KEY (`CartItemID`),
  FOREIGN KEY (`CartID`) REFERENCES `CART`(`CartID`),
  FOREIGN KEY (`ProductID`) REFERENCES `PRODUCT`(`ProductID`)
);

CREATE TABLE `ORDERS` (
  `OrderID` int,
  `CustomerID` int,
  `Date` datetime,
  `TotalAmount` decimal,
  `Status` varchar,
  PRIMARY KEY (`OrderID`),
  FOREIGN KEY (`CustomerID`) REFERENCES `CUSTOMER`(`Customer_ID`)
);
