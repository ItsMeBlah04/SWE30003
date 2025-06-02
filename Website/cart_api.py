from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = 'shop.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    data = request.json
    product_id = data.get('product_id')
    customer_id = data.get('customer_id')  # Should be provided by frontend/session

    if not product_id or not customer_id:
        return jsonify({'success': False, 'message': 'Missing product_id or customer_id'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Find or create cart for this customer
    cur.execute("SELECT CartID FROM CART WHERE CustomerID = ?", (customer_id,))
    cart = cur.fetchone()
    if cart:
        cart_id = cart['CartID']
    else:
        cur.execute("INSERT INTO CART (CustomerID, TotalAmount) VALUES (?, ?)", (customer_id, 0))
        cart_id = cur.lastrowid

    # Check if product already in cart
    cur.execute("SELECT Quantity FROM CART_ITEM WHERE CartID = ? AND ProductID = ?", (cart_id, product_id))
    item = cur.fetchone()
    if item:
        cur.execute("UPDATE CART_ITEM SET Quantity = Quantity + 1 WHERE CartID = ? AND ProductID = ?", (cart_id, product_id))
    else:
        cur.execute("INSERT INTO CART_ITEM (CartID, ProductID, Quantity) VALUES (?, ?, ?)", (cart_id, product_id, 1))

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Added to cart'})

@app.route('/get_cart_details', methods=['GET'])
def get_cart_details():
    customer_id = request.args.get('customer_id')

    if not customer_id:
        return jsonify({'success': False, 'message': 'Customer ID is required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Get cart items and product details
    query = """
        SELECT ci.ProductID, p.Name, p.Price, ci.Quantity
        FROM CART_ITEM ci
        JOIN CART c ON ci.CartID = c.CartID
        JOIN PRODUCT p ON ci.ProductID = p.ProductID
        WHERE c.CustomerID = ?
    """
    cur.execute(query, (customer_id,))
    items_data = cur.fetchall()

    cart_items = []
    subtotal = 0
    for row in items_data:
        item_total = row['Price'] * row['Quantity']
        cart_items.append({
            'product_id': row['ProductID'],
            'name': row['Name'],
            'price': row['Price'],
            'quantity': row['Quantity'],
            'item_total': item_total
        })
        subtotal += item_total

    # You can make shipping dynamic or configurable if needed
    shipping_fee = 10 if subtotal > 0 else 0 
    total_amount = subtotal + shipping_fee
    
    # Update the TotalAmount in the CART table (optional, but good practice)
    if cart_items: # Only update if there are items
        cur.execute("SELECT CartID FROM CART WHERE CustomerID = ?", (customer_id,))
        cart_data = cur.fetchone()
        if cart_data:
            cart_id_to_update = cart_data['CartID']
            cur.execute("UPDATE CART SET TotalAmount = ? WHERE CartID = ?", (subtotal, cart_id_to_update))
            conn.commit()

    conn.close()

    return jsonify({
        'success': True,
        'items': cart_items,
        'subtotal': subtotal,
        'shipping_fee': shipping_fee,
        'total_amount': total_amount
    })

if __name__ == '__main__':
    app.run(port=5002, debug=True) 