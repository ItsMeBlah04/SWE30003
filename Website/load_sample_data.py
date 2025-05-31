import sqlite3
import os

# Sample product data
sample_products = [
    {
        "name": "iPhone 16 Pro",
        "category": "phone",
        "price": 999.00,
        "stock": 45,
        "image": "../images/iphone.jpg",
        "description": "Apple's latest flagship phone with advanced camera system.",
        "barcode": "123456789012",
        "serialNumber": "IPHONE16PRO-001",
        "manufacturer": "Apple",
        "adminId": 1
    },
    {
        "name": "Apple Watch 10",
        "category": "watch",
        "price": 399.00,
        "stock": 30,
        "image": "../images/apple_watch.jpg",
        "description": "Thin and light Apple Watch for indoor and outdoor activities.",
        "barcode": "123456789013",
        "serialNumber": "APPLEWATCH10-001",
        "manufacturer": "Apple",
        "adminId": 1
    },
    {
        "name": "iPad Pro 11",
        "category": "tablet",
        "price": 799.00,
        "stock": 25,
        "image": "../images/ipad.jpg",
        "description": "Professional-grade tablet with M2 chip.",
        "barcode": "123456789014",
        "serialNumber": "IPADPRO11-001",
        "manufacturer": "Apple",
        "adminId": 1
    },
    {
        "name": "MacBook Air M2",
        "category": "laptop",
        "price": 1299.00,
        "stock": 20,
        "image": "../images/macbook.jpg",
        "description": "Thin and light laptop with all-day battery life.",
        "barcode": "123456789015",
        "serialNumber": "MACBOOKAIRM2-001",
        "manufacturer": "Apple",
        "adminId": 1
    },
    {
        "name": "Apple Watch Ultra",
        "category": "watch",
        "price": 1399.00,
        "stock": 15,
        "image": "../images/apple_watch_ultra.jpg",
        "description": "Rugged and capable Apple Watch for outdoor adventures.",
        "barcode": "123456789016",
        "serialNumber": "APPLEWATCHULTRA-001",
        "manufacturer": "Apple",
        "adminId": 1
    }
]

def insert_sample_data():
    # Path to the database file
    db_file = 'shop.db'
    
    # Check if database exists
    if not os.path.exists(db_file):
        print(f"Database file {db_file} does not exist. Please run the application first to create it.")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if PRODUCT table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PRODUCT'")
        if not cursor.fetchone():
            print("PRODUCT table does not exist. Please run the application first to create it.")
            conn.close()
            return False
        
        # Check if there are already products in the table
        cursor.execute("SELECT COUNT(*) as count FROM PRODUCT")
        count = cursor.fetchone()['count']
        
        if count > 0:
            print(f"There are already {count} products in the database. Do you want to add more? (y/n)")
            response = input().strip().lower()
            if response != 'y':
                print("Aborted. No changes made to the database.")
                conn.close()
                return False
        
        # Insert sample products
        for product in sample_products:
            cursor.execute("""
                INSERT INTO PRODUCT (Name, Description, Price, Stock, Category, Image, Barcode, SerialNumber, Manufacter, AdminID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                product["name"],
                product["description"],
                product["price"],
                product["stock"],
                product["category"],
                product["image"],
                product["barcode"],
                product["serialNumber"],
                product["manufacturer"],
                product["adminId"]
            ))
        
        # Commit changes
        conn.commit()
        print(f"Successfully added {len(sample_products)} sample products to the database.")
        
        # Close connection
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error inserting sample data: {e}")
        return False

if __name__ == "__main__":
    insert_sample_data() 