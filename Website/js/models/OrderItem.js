/**
 * OrderItem Model
 * Represents an item in an order
 */
class OrderItem extends BaseModel {
    /**
     * Create a new OrderItem instance
     * @param {Object} data - OrderItem data
     */
    constructor(data = {}) {
        super(data);
        
        // Set default values if not provided
        this.order_item_id = data.order_item_id || null;
        this.order_id = data.order_id || null;
        this.product_id = data.product_id || null;
        this.quantity = data.quantity || 1;
        
        // Additional properties from product
        this.name = data.name || '';
        this.price = data.price || 0;
        this.category = data.category || '';
        this.image = data.image || '';
        
        // Reference to parent order (circular reference)
        this._order = null;
    }

    /**
     * Get the subtotal for this item (price * quantity)
     * @returns {number} Subtotal
     */
    get subtotal() {
        return this.price * this.quantity;
    }

    /**
     * Load product data for this item
     * @returns {Promise} Promise that resolves when product data is loaded
     */
    loadProductData() {
        return new Promise((resolve, reject) => {
            if (!this.product_id) {
                reject('No product ID specified');
                return;
            }
            
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'get_product');
            formData.append('id', this.product_id);
            
            // Send request to API
            fetch('http://localhost:5000/admin_update_product', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update item with product data
                    this.name = data.product.name;
                    this.price = data.product.price;
                    this.category = data.product.category;
                    this.image = data.product.image;
                    
                    resolve(this);
                } else {
                    reject(data.message || 'Error loading product data');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Save order item to the database (create or update)
     * @returns {Promise} Promise that resolves with saved OrderItem instance
     */
    save() {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = this.toFormData();
            formData.append('action', this.order_item_id ? 'update_order_item' : 'create_order_item');
            
            // Send request to API
            fetch('http://localhost:5000/order_items', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update order_item_id for new items
                    if (!this.order_item_id && data.order_item_id) {
                        this.order_item_id = data.order_item_id;
                    }
                    
                    resolve(this);
                } else {
                    reject(data.message || 'Error saving order item');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Delete order item from the database
     * @returns {Promise} Promise that resolves when item is deleted
     */
    delete() {
        return new Promise((resolve, reject) => {
            if (!this.order_item_id) {
                reject('Cannot delete item without ID');
                return;
            }
            
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'delete_order_item');
            formData.append('id', this.order_item_id);
            
            // Send request to API
            fetch('http://localhost:5000/order_items', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve();
                } else {
                    reject(data.message || 'Error deleting order item');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }
} 