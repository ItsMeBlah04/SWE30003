import sqlite3
import os

def view_products():
    # Path to the database file
    db_file = 'shop.db'
    
    # Check if database exists
    if not os.path.exists(db_file):
        print(f"Database file {db_file} does not exist.")
        return False
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_file)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if PRODUCT table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='PRODUCT'")
        if not cursor.fetchone():
            print("PRODUCT table does not exist.")
            conn.close()
            return False
        
        # Get table schema
        print("\n==== PRODUCT TABLE SCHEMA ====")
        cursor.execute("PRAGMA table_info(PRODUCT)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"{col['name']} ({col['type']})")
        
        # Count products
        cursor.execute("SELECT COUNT(*) as count FROM PRODUCT")
        count = cursor.fetchone()['count']
        print(f"\nTotal products: {count}")
        
        # Get all products
        cursor.execute("SELECT * FROM PRODUCT")
        products = cursor.fetchall()
        
        if not products:
            print("\nNo products found in the database.")
        else:
            print("\n==== PRODUCT TABLE DATA ====")
            for product in products:
                print(f"\nID: {product['ProductID']}")
                print(f"Name: {product['Name']}")
                print(f"Category: {product.get('Category', 'N/A')}")
                print(f"Price: ${product['Price']}")
                print(f"Stock: {product['Stock']}")
                print(f"Description: {product['Description'][:50]}..." if len(product['Description']) > 50 else f"Description: {product['Description']}")
                print(f"Barcode: {product['Barcode']}")
                print(f"Serial Number: {product['SerialNumber']}")
                print(f"Manufacturer: {product['Manufacter']}")
                print("-" * 40)
        
        # Close connection
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error viewing products: {e}")
        return False

if __name__ == "__main__":
    view_products() 