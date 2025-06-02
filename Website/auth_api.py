from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS
from werkzeug.security import check_password_hash # For checking passwords

app = Flask(__name__)
CORS(app)

DB_PATH = 'shop.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch user from AUTHENTICATOR table
    # We need to know if it's a customer or admin login later,
    # for now, just get CustomerID and AdminID if they exist.
    cur.execute("SELECT CustomerID, AdminID, PasswordHarsh FROM AUTHENTICATOR WHERE UserName = ?", (username,))
    user_auth_data = cur.fetchone()
    conn.close()

    if user_auth_data:
        stored_password_hash = user_auth_data['PasswordHarsh']
        if check_password_hash(stored_password_hash, password):
            # Password matches
            customer_id = user_auth_data['CustomerID']
            admin_id = user_auth_data['AdminID']
            
            user_type = None
            user_id = None

            if customer_id is not None:
                user_type = 'customer'
                user_id = customer_id
            elif admin_id is not None:
                user_type = 'admin'
                user_id = admin_id
            
            if user_type:
                return jsonify({
                    'success': True, 
                    'message': 'Login successful',
                    'user_type': user_type,
                    'user_id': user_id, # This could be CustomerID or AdminID
                    'username': username 
                }), 200
            else:
                # Should not happen if data is consistent, but good to handle
                return jsonify({'success': False, 'message': 'User role unclear'}), 500
        else:
            # Password does not match
            return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    else:
        # User not found
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

# Placeholder for signup - we'll need generate_password_hash here
# @app.route('/signup', methods=['POST'])
# def signup():
#     # ... implementation ...
#     pass

if __name__ == '__main__':
    # Running on a different port (e.g., 5003) to avoid conflicts
    # with your other API services.
    app.run(port=5003, debug=True) 