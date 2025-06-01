from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database path
DB_PATH = 'shop.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/analytics', methods=['GET'])
def get_analytics_data():
    # Get filter parameters
    month = request.args.get('month', 'all')
    year = request.args.get('year', 'all')
    category = request.args.get('category', 'all')
    
    # Connect to database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build filter conditions
        conditions = []
        params = []
        
        if month != 'all':
            conditions.append("strftime('%m', o.Date) = ?")
            params.append(month.zfill(2))
        
        if year != 'all':
            conditions.append("strftime('%Y', o.Date) = ?")
            params.append(year)
        
        if category != 'all':
            conditions.append("p.Category LIKE ?")
            params.append(f"%{category}%")
        
        where_clause = ''
        if conditions:
            where_clause = 'WHERE ' + ' AND '.join(conditions)
        
        # Calculate total revenue
        query = f"""
            SELECT SUM(o.TotalAmount) as total_revenue
            FROM ORDERS o
            JOIN ORDERS_ITEM oi ON o.OrderID = oi.OrderID
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            {where_clause}
        """
        cursor.execute(query, params)
        result = cursor.fetchone()
        total_revenue = float(result['total_revenue']) if result['total_revenue'] else 0
        
        # Get total orders
        query = f"""
            SELECT COUNT(DISTINCT o.OrderID) as total_orders
            FROM ORDERS o
            JOIN ORDERS_ITEM oi ON o.OrderID = oi.OrderID
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            {where_clause}
        """
        cursor.execute(query, params)
        result = cursor.fetchone()
        total_orders = int(result['total_orders']) if result['total_orders'] else 0
        
        # Calculate average order value
        avg_order = total_revenue / total_orders if total_orders > 0 else 0
        
        # Get monthly sales data
        monthly_sales = [0] * 12  # Initialize with zeros
        
        # Adjust where clause for monthly sales query
        monthly_where_clause = where_clause.replace('o.Date', 'Date')
        
        query = f"""
            SELECT 
                strftime('%m', Date) as month,
                SUM(TotalAmount) as revenue
            FROM ORDERS o
            {monthly_where_clause}
            GROUP BY month
            ORDER BY month
        """
        cursor.execute(query, params)
        
        for row in cursor.fetchall():
            month_idx = int(row['month']) - 1  # Convert to 0-based index
            monthly_sales[month_idx] = float(row['revenue'])
        
        # Get category distribution
        query = f"""
            SELECT 
                p.Category,
                SUM(p.Price * oi.Quantity) as revenue
            FROM ORDERS_ITEM oi
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            JOIN ORDERS o ON oi.OrderID = o.OrderID
            {where_clause}
            GROUP BY p.Category
            ORDER BY revenue DESC
        """
        cursor.execute(query, params)
        
        # Initialize categories
        categories = {
            'phone': 0,
            'tablet': 0,
            'laptop': 0,
            'watch': 0,
            'accessories': 0
        }
        
        # Fill in category data
        total_cat_revenue = 0
        for row in cursor.fetchall():
            category = row['Category'].lower() if row['Category'] else 'accessories'
            revenue = float(row['revenue']) if row['revenue'] else 0
            total_cat_revenue += revenue
            
            # Map category to one of our predefined categories
            if 'phone' in category:
                categories['phone'] += revenue
            elif 'tablet' in category:
                categories['tablet'] += revenue
            elif 'laptop' in category:
                categories['laptop'] += revenue
            elif 'watch' in category:
                categories['watch'] += revenue
            else:
                categories['accessories'] += revenue
        
        # Calculate percentages
        if total_cat_revenue > 0:
            for cat in categories:
                categories[cat] = round((categories[cat] / total_cat_revenue) * 100)
        
        # Get top products
        query = f"""
            SELECT 
                p.ProductID,
                p.Name,
                p.Category,
                SUM(oi.Quantity) as units,
                SUM(p.Price * oi.Quantity) as revenue
            FROM ORDERS_ITEM oi
            JOIN PRODUCT p ON oi.ProductID = p.ProductID
            JOIN ORDERS o ON oi.OrderID = o.OrderID
            {where_clause}
            GROUP BY p.ProductID
            ORDER BY revenue DESC
            LIMIT 5
        """
        cursor.execute(query, params)
        
        top_products = []
        for row in cursor.fetchall():
            category = row['Category'].lower() if row['Category'] else 'accessories'
            
            # Map to simplified category
            simple_category = 'accessories'
            if 'phone' in category:
                simple_category = 'phone'
            elif 'tablet' in category:
                simple_category = 'tablet'
            elif 'laptop' in category:
                simple_category = 'laptop'
            elif 'watch' in category:
                simple_category = 'watch'
            
            top_products.append({
                'name': row['Name'],
                'category': simple_category,
                'units': int(row['units']),
                'revenue': float(row['revenue'])
            })
        
        conn.close()
        
        # Prepare response
        return jsonify({
            'success': True,
            'stats': {
                'totalRevenue': round(total_revenue, 2),
                'totalOrders': total_orders,
                'averageOrder': round(avg_order, 2),
                'conversionRate': 3.2  # Hardcoded for now
            },
            'monthlySales': monthly_sales,
            'categoryData': categories,
            'topProducts': top_products
        })
        
    except Exception as e:
        if conn:
            conn.close()
        return jsonify({
            'success': False,
            'message': str(e)
        })

if __name__ == '__main__':
    app.run(port=5001, debug=True) 