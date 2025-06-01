import csv
import random
import datetime

# Products from the database (as provided by user)
PRODUCTS = [
    {"id": 2, "name": "iPhone 16", "price": 999.0, "category": "phone"},
    {"id": 3, "name": "Apple Watch Ultra", "price": 2000.0, "category": "watch"},
    {"id": 4, "name": "Apple Watch", "price": 499.0, "category": "watch"},
    {"id": 5, "name": "MacBook", "price": 2500.0, "category": "laptop"},
    {"id": 6, "name": "iPad Pro", "price": 1500.0, "category": "tablet"}
]

def generate_orders_csvs(num_orders=500):
    """Generate separate CSV files for ORDERS and ORDERS_ITEM tables"""
    # Prepare Orders CSV file
    with open("orders.csv", 'w', newline='') as orders_file:
        orders_fields = ['OrderID', 'CustomerID', 'Date', 'TotalAmount', 'Status']
        orders_writer = csv.DictWriter(orders_file, fieldnames=orders_fields)
        orders_writer.writeheader()
        
        # Prepare OrderItems CSV file
        with open("orders_item.csv", 'w', newline='') as items_file:
            items_fields = ['OrderItemID', 'OrderID', 'ProductID', 'Quantity']
            items_writer = csv.DictWriter(items_file, fieldnames=items_fields)
            items_writer.writeheader()
            
            print(f"Generating {num_orders} orders with items...")
            
            # Generate dates spanning 2022-2023
            all_months = []
            for year in [2022, 2023]:
                for month in range(1, 13):
                    all_months.append((year, month))
            
            # Track OrderItemID
            order_item_id = 1
            
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
                    item_total = quantity * product['price']
                    total_amount += item_total
                    
                    # Write order item to CSV
                    items_writer.writerow({
                        'OrderItemID': order_item_id,
                        'OrderID': order_id,
                        'ProductID': product['id'],
                        'Quantity': quantity
                    })
                    
                    # Increment OrderItemID
                    order_item_id += 1
                
                # Write order to CSV
                orders_writer.writerow({
                    'OrderID': order_id,
                    'CustomerID': customer_id,
                    'Date': order_date_str,
                    'TotalAmount': round(total_amount, 2),
                    'Status': status
                })
    
    print(f"Generated {num_orders} orders in orders.csv")
    print(f"Generated {order_item_id - 1} order items in orders_item.csv")

if __name__ == "__main__":
    # Generate orders and export to CSV
    generate_orders_csvs(500) 