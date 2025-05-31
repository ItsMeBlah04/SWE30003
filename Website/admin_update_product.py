from flask import Flask, request, jsonify
import sqlite3
import os
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
DB_FILE = 'shop.db'  # SQLite database file

# Connect to the database
def get_db_connection():
    try:
        # Create the database directory if it doesn't exist
        os.makedirs(os.path.dirname(os.path.abspath(DB_FILE)), exist_ok=True)
        
        # Connect to SQLite database (will create it if it doesn't exist)
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row  # This enables column access by name
        return conn
    except sqlite3.Error as err:
        print(f"Database connection error: {err}")
        return None

# Check if table has specific columns
def check_column_exists(conn, table, column):
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = cursor.fetchall()
    cursor.close()
    return any(col['name'] == column for col in columns)

# Initialize database from SQL file if needed
def init_database():
    # Check if database exists and is initialized
    if not os.path.exists(DB_FILE) or os.path.getsize(DB_FILE) == 0:
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                
                # Read SQLite SQL file
                with open('sql/database_sqlite.sql', 'r') as sql_file:
                    sql_script = sql_file.read()
                
                # Execute script statement by statement
                statements = sql_script.split(';')
                for statement in statements:
                    if statement.strip():
                        cursor.execute(statement)
                
                conn.commit()
                print("Database initialized successfully from SQL file")
            except Exception as e:
                print(f"Error initializing database: {e}")
            finally:
                conn.close()

# Initialize database when app starts
init_database()

# Handle all product operations
@app.route('/admin_update_product', methods=['POST'])
def admin_update_product():
    # Initialize response
    response = {
        'success': False,
        'message': ''
    }
    
    try:
        # Get the database connection
        conn = get_db_connection()
        if not conn:
            response['message'] = "Database connection failed"
            return jsonify(response)
        
        # Get action from request
        action = request.form.get('action')
        
        # Check if table has Category and Image columns
        has_category_column = check_column_exists(conn, 'PRODUCT', 'Category')
        has_image_column = check_column_exists(conn, 'PRODUCT', 'Image')
        
        # Handle product update
        if action == 'update':
            product_id = int(request.form.get('id', 0))
            name = request.form.get('name', '')
            category = request.form.get('category', '')
            description = request.form.get('description', '')
            price = float(request.form.get('price', 0))
            stock = int(request.form.get('stock', 0))
            image = request.form.get('image', '')
            barcode = request.form.get('barcode', '')
            serial_number = request.form.get('serial_number', '')
            manufacturer = request.form.get('manufacturer', '')
            admin_id = int(request.form.get('admin_id', 1))
            
            if product_id > 0:
                cursor = conn.cursor()
                
                # Build SQL based on available columns
                sql = "UPDATE PRODUCT SET Name = ?, Description = ?, Price = ?, Stock = ?, "
                params = [name, description, price, stock]
                
                if has_category_column:
                    sql += "Category = ?, "
                    params.append(category)
                
                if has_image_column:
                    sql += "Image = ?, "
                    params.append(image)
                
                sql += "Barcode = ?, SerialNumber = ?, Manufacter = ?, AdminID = ? WHERE ProductID = ?"
                params.extend([barcode, serial_number, manufacturer, admin_id, product_id])
                
                cursor.execute(sql, params)
                conn.commit()
                cursor.close()
                
                response['success'] = True
                response['message'] = "Product updated successfully"
            else:
                response['message'] = "Invalid product ID"
                
        # Handle product creation
        elif action == 'create':
            name = request.form.get('name', '')
            category = request.form.get('category', '')
            description = request.form.get('description', '')
            price = float(request.form.get('price', 0))
            stock = int(request.form.get('stock', 0))
            image = request.form.get('image', '')
            barcode = request.form.get('barcode', '')
            serial_number = request.form.get('serial_number', '')
            manufacturer = request.form.get('manufacturer', '')
            admin_id = int(request.form.get('admin_id', 1))
            
            cursor = conn.cursor()
            
            # Build SQL based on available columns
            columns = "Name, Description, Price, Stock"
            placeholders = "?, ?, ?, ?"
            params = [name, description, price, stock]
            
            if has_category_column:
                columns += ", Category"
                placeholders += ", ?"
                params.append(category)
            
            if has_image_column:
                columns += ", Image"
                placeholders += ", ?"
                params.append(image)
            
            columns += ", Barcode, SerialNumber, Manufacter, AdminID"
            placeholders += ", ?, ?, ?, ?"
            params.extend([barcode, serial_number, manufacturer, admin_id])
            
            sql = f"INSERT INTO PRODUCT ({columns}) VALUES ({placeholders})"
            cursor.execute(sql, params)
            conn.commit()
            
            # Get the ID of the new product
            product_id = cursor.lastrowid
            cursor.close()
            
            response['success'] = True
            response['message'] = "Product created successfully"
            response['id'] = product_id
            
        # Handle product deletion
        elif action == 'delete':
            product_id = int(request.form.get('id', 0))
            
            if product_id > 0:
                cursor = conn.cursor()
                
                # Check if product exists in any orders
                cursor.execute("SELECT COUNT(*) AS count FROM ORDERS_ITEM WHERE ProductID = ?", (product_id,))
                result = cursor.fetchone()
                
                if result['count'] > 0:
                    response['message'] = "Cannot delete product that exists in orders"
                else:
                    # Remove from cart items first
                    cursor.execute("DELETE FROM CART_ITEM WHERE ProductID = ?", (product_id,))
                    
                    # Delete the product
                    cursor.execute("DELETE FROM PRODUCT WHERE ProductID = ?", (product_id,))
                    conn.commit()
                    
                    response['success'] = True
                    response['message'] = "Product deleted successfully"
                
                cursor.close()
            else:
                response['message'] = "Invalid product ID"
                
        # Handle retrieving all products
        elif action == 'get_all':
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM PRODUCT ORDER BY ProductID")
            rows = cursor.fetchall()
            cursor.close()
            
            products = []
            for row in rows:
                # Transform database column names to match JS frontend expectations
                product = {
                    'id': row['ProductID'],
                    'name': row['Name'],
                    'price': float(row['Price']),
                    'stock': int(row['Stock']),
                    'description': row['Description'],
                    'barcode': row['Barcode'],
                    'serialNumber': row['SerialNumber'],
                    'manufacturer': row['Manufacter'],
                    'adminId': row['AdminID']
                }
                
                # Add category if it exists
                if has_category_column and 'Category' in dict(row):
                    product['category'] = row['Category']
                else:
                    product['category'] = ''  # Default value
                
                # Add image if it exists
                if has_image_column and 'Image' in dict(row):
                    product['image'] = row['Image']
                else:
                    product['image'] = '../images/placeholder.jpg'  # Default placeholder
                
                products.append(product)
            
            response['success'] = True
            response['products'] = products
            
        # Handle retrieving a single product
        elif action == 'get_product':
            product_id = int(request.form.get('id', 0))
            
            if product_id > 0:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM PRODUCT WHERE ProductID = ?", (product_id,))
                row = cursor.fetchone()
                cursor.close()
                
                if row:
                    # Transform database column names to match JS frontend expectations
                    product = {
                        'id': row['ProductID'],
                        'name': row['Name'],
                        'price': float(row['Price']),
                        'stock': int(row['Stock']),
                        'description': row['Description'],
                        'barcode': row['Barcode'],
                        'serialNumber': row['SerialNumber'],
                        'manufacturer': row['Manufacter'],
                        'adminId': row['AdminID']
                    }
                    
                    # Add category if it exists
                    if has_category_column and 'Category' in dict(row):
                        product['category'] = row['Category']
                    else:
                        product['category'] = ''  # Default value
                    
                    # Add image if it exists
                    if has_image_column and 'Image' in dict(row):
                        product['image'] = row['Image']
                    else:
                        product['image'] = '../images/placeholder.jpg'  # Default placeholder
                    
                    response['success'] = True
                    response['product'] = product
                else:
                    response['message'] = "Product not found"
            else:
                response['message'] = "Invalid product ID"
                
        else:
            response['message'] = "Invalid action specified"
            
        # Close the database connection
        conn.close()
        
    except Exception as e:
        response['message'] = f"Error: {str(e)}"
    
    return jsonify(response)

# Add this new route to view database tables
@app.route('/db_viewer', methods=['GET'])
def db_viewer():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Get list of all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row['name'] for row in cursor.fetchall()]
        
        # Get table data if specified
        table_name = request.args.get('table')
        table_data = None
        columns = None
        
        if table_name and table_name in tables:
            # Get columns
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [col['name'] for col in cursor.fetchall()]
            
            # Get data
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 100")
            rows = cursor.fetchall()
            table_data = [dict(row) for row in rows]
        
        conn.close()
        
        # Return HTML page for better viewing
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>SQLite Database Viewer</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2 {{ color: #333; }}
                .tables {{ display: flex; flex-wrap: wrap; margin-bottom: 20px; }}
                .tables a {{ margin: 5px; padding: 8px 15px; background: #f0f0f0; 
                           text-decoration: none; color: #333; border-radius: 4px; }}
                .tables a:hover {{ background: #e0e0e0; }}
                .tables a.active {{ background: #007bff; color: white; }}
                table {{ border-collapse: collapse; width: 100%; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f2f2f2; }}
                tr:nth-child(even) {{ background-color: #f9f9f9; }}
            </style>
        </head>
        <body>
            <h1>SQLite Database Viewer</h1>
            
            <div class="tables">
                <strong>Tables: </strong>
                {' '.join([f'<a href="/db_viewer?table={t}" class="{"active" if table_name == t else ""}">{t}</a>' for t in tables])}
            </div>
            
            {f'<h2>Table: {table_name}</h2>' if table_name else ''}
            
            {f'''
            <table>
                <thead>
                    <tr>{''.join([f'<th>{col}</th>' for col in columns])}</tr>
                </thead>
                <tbody>
                    {''.join([f"<tr>{''.join([f'<td>{row.get(col, '')}</td>' for col in columns])}</tr>" for row in table_data])}
                </tbody>
            </table>
            ''' if table_data else ''}
            
        </body>
        </html>
        """
        
        return html
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000) 