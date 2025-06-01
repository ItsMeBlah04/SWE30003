import sqlite3
import csv
import random
import datetime
import os

# Database configuration
DB_FILE = 'shop.db'

# Products from the database (as provided by user)
PRODUCTS = [
    {"id": 2, "name": "iPhone 16", "price": 999.0, "category": "phone"},
    {"id": 3, "name": "Apple Watch Ultra", "price": 2000.0, "category": "watch"},
    {"id": 4, "name": "Apple Watch", "price": 499.0, "category": "watch"},
    {"id": 5, "name": "MacBook", "price": 2500.0, "category": "laptop"},
    {"id": 6, "name": "iPad Pro", "price": 1500.0, "category": "tablet"}
]

def generate_fake_orders_csv(num_orders=500, output_file="orders_data.csv"):
    """Generate fake orders and export to CSV"""
    # Prepare CSV file
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = [
            'OrderID', 'Date', 'CustomerID', 'TotalAmount', 'Status',
            'ProductID', 'ProductName', 'Category', 'Quantity', 'UnitPrice', 'ItemTotal'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        print(f"Generating {num_orders} fake orders...")
        
        # Generate dates spanning 2022-2023
        all_months = []
        for year in [2022, 2023]:
            for month in range(1, 13):
                all_months.append((year, month))
        
        # Generate orders
        for order_id in range(1, num_orders + 1):
            # Select a random year and month
            year, month = random.choice(all_months)
            
            # Generate a random day in that month
            if month in [4, 6, 9, 11]:
                max_day = 30
            elif month == 2:
                # Simple leap year check
                max_day = 29 if year % 4 == 0 else 28
            else:
                max_day = 31
                
            day = random.randint(1, max_day)
            
            # Create date string
            order_date_str = f"{year}-{month:02d}-{day:02d}"
            
            # Random customer ID between 1 and 20
            customer_id = random.randint(1, 20)
            
            # Order status
            status = random.choice(["Completed", "Processing", "Shipped", "Delivered"])
            
            # Generate between 1 and 3 items per order
            num_items = random.randint(1, 3)
            selected_products = random.sample(PRODUCTS, min(num_items, len(PRODUCTS)))
            
            # Calculate total amount
            total_amount = 0
            
            # Create order items for this order
            for product in selected_products:
                quantity = random.randint(1, 3)
                unit_price = product['price']
                item_total = quantity * unit_price
                total_amount += item_total
                
                # Write order item to CSV
                writer.writerow({
                    'OrderID': order_id,
                    'Date': order_date_str,
                    'CustomerID': customer_id,
                    'TotalAmount': round(total_amount, 2),
                    'Status': status,
                    'ProductID': product['id'],
                    'ProductName': product['name'],
                    'Category': product['category'],
                    'Quantity': quantity,
                    'UnitPrice': unit_price,
                    'ItemTotal': round(item_total, 2)
                })
    
    print(f"Generated {num_orders} orders with products from your database")
    print(f"Data exported to {output_file}")

if __name__ == "__main__":
    # Generate orders and export to CSV
    generate_fake_orders_csv(500) 