# Product Catalog Management System - Python Backend

This is a Python backend for the product catalog management system. It provides a RESTful API for managing products in the database.

## Requirements

- Python 3.8 or higher
- Required Python packages (see requirements.txt)

## Setup Instructions

1. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Database Configuration**

   The application uses SQLite, which is included in Python's standard library. No additional database setup is required.
   
   The SQLite database file will be created automatically as `shop.db` when the application starts.
   
   The database will be initialized using the SQL script at `sql/database.sql`. The script will be automatically converted from MySQL syntax to SQLite syntax.

3. **Run the Flask application**

   ```bash
   python wsgi.py
   ```

   This will start the Flask server on http://localhost:5000

4. **Update the JavaScript API URL**

   Ensure that `js/admin_products_api.js` points to the correct API URL:

   ```javascript
   const API_URL = 'http://localhost:5000/admin_update_product';
   ```

## API Endpoints

The Python backend provides the following API endpoints:

### POST /admin_update_product

This is the main endpoint that handles all product management operations.

#### Request Parameters

The endpoint accepts the following parameters in the request body:

- `action`: The action to perform (required). Possible values:
  - `get_all`: Get all products
  - `get_product`: Get a single product by ID
  - `create`: Create a new product
  - `update`: Update an existing product
  - `delete`: Delete a product

Depending on the action, additional parameters may be required:

- For `get_product` and `delete`:
  - `id`: The ID of the product

- For `create` and `update`:
  - `name`: The name of the product
  - `description`: The description of the product
  - `price`: The price of the product
  - `stock`: The stock quantity of the product
  - `category`: The category of the product (optional)
  - `image`: The URL of the product image (optional)
  - `barcode`: The barcode of the product (optional)
  - `serial_number`: The serial number of the product (optional)
  - `manufacturer`: The manufacturer of the product (optional)
  - `admin_id`: The ID of the admin who created/updated the product (optional, defaults to 1)

For `update`, the `id` parameter is also required.

#### Response Format

The API returns JSON responses with the following structure:

```json
{
  "success": true|false,
  "message": "Success or error message",
  "products": [...] | "product": {...} | "id": ...
}
```

- `success`: Boolean indicating whether the operation was successful
- `message`: A message describing the result of the operation
- `products`: Array of product objects (for `get_all` action)
- `product`: Product object (for `get_product` action)
- `id`: ID of the newly created product (for `create` action)

## Advantages of SQLite

- **Zero Configuration**: SQLite doesn't require a separate server process or system configuration
- **Portability**: The entire database is stored in a single file that can be easily moved or copied
- **Reliability**: SQLite is known for its stability, reliability, and performance
- **Zero Maintenance**: No need for a database administrator to install, configure, or maintain
- **Lightweight**: Minimal resource requirements, perfect for smaller applications

## Production Deployment

For production deployment, it's recommended to use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn wsgi:app
```

You can also configure a reverse proxy like Nginx to serve the application.

## Troubleshooting

If you encounter any issues:

1. Check that the SQL script is correctly formatted
2. Ensure the application has write permissions to create the database file
3. Check the Python error logs
4. Ensure that CORS is properly configured if accessing from a different domain 