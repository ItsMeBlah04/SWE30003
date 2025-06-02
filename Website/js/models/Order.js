/**
 * Order Model
 * Represents a customer order in the system
 */
class Order extends BaseModel {
    /**
     * Create a new Order instance
     * @param {Object} data - Order data
     */
    constructor(data = {}) {
        super(data);
        
        // Set default values if not provided
        this.order_id = data.order_id || null;
        this.customer_id = data.customer_id || null;
        this.date = data.date || new Date().toISOString();
        this.total_amount = data.total_amount || 0;
        
        // Related objects
        this._items = []; // OrderItem instances
        this._payment = null; // Payment instance
        this._shipment = null; // Shipment instance
        this._invoice = null; // Invoice instance
        
        // Load order items if provided
        if (data.items && Array.isArray(data.items)) {
            this._items = data.items.map(item => {
                // If it's already an OrderItem instance, use it
                if (item instanceof OrderItem) {
                    return item;
                }
                // Otherwise create a new OrderItem instance
                return new OrderItem(item);
            });
        }
    }

    /**
     * Get order items
     * @returns {Array} Array of OrderItem instances
     */
    get items() {
        return this._items;
    }

    /**
     * Set order items
     * @param {Array} items - Array of OrderItem instances or data
     */
    set items(items) {
        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }
        
        this._items = items.map(item => {
            if (item instanceof OrderItem) {
                return item;
            }
            return new OrderItem(item);
        });
    }

    /**
     * Add an item to the order
     * @param {OrderItem|Object} item - OrderItem instance or data
     */
    addItem(item) {
        if (!(item instanceof OrderItem)) {
            item = new OrderItem(item);
        }
        
        // Set order_id if not set
        if (this.order_id && !item.order_id) {
            item.order_id = this.order_id;
        }
        
        this._items.push(item);
        this._recalculateTotal();
    }

    /**
     * Remove an item from the order
     * @param {number} index - Index of the item to remove
     */
    removeItem(index) {
        if (index >= 0 && index < this._items.length) {
            this._items.splice(index, 1);
            this._recalculateTotal();
        }
    }

    /**
     * Recalculate order total based on items
     * @private
     */
    _recalculateTotal() {
        this.total_amount = this._items.reduce((total, item) => {
            return total + (item.quantity * item.price);
        }, 0);
    }

    /**
     * Get order by ID from the database
     * @param {number} id - Order ID
     * @returns {Promise} Promise that resolves with Order instance
     */
    static getById(id) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'get_order');
            formData.append('id', id);
            
            // Send request to API
            fetch('http://localhost:5000/orders', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const order = new Order(data.order);
                    
                    // Load order items
                    if (data.items && Array.isArray(data.items)) {
                        order.items = data.items.map(item => new OrderItem(item));
                    }
                    
                    resolve(order);
                } else {
                    reject(data.message || 'Error getting order');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Get all orders from the database
     * @param {Object} filters - Optional filters
     * @returns {Promise} Promise that resolves with array of Order instances
     */
    static getAll(filters = {}) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'get_all_orders');
            
            // Add filters
            for (const key in filters) {
                formData.append(key, filters[key]);
            }
            
            // Send request to API
            fetch('http://localhost:5000/orders', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const orders = data.orders.map(orderData => new Order(orderData));
                    resolve(orders);
                } else {
                    reject(data.message || 'Error getting orders');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Save order to the database (create or update)
     * @returns {Promise} Promise that resolves with saved Order instance
     */
    save() {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = this.toFormData();
            formData.append('action', this.order_id ? 'update_order' : 'create_order');
            
            // Add items data
            formData.append('items', JSON.stringify(this._items.map(item => {
                const itemData = { ...item };
                // Remove circular reference
                delete itemData._order;
                return itemData;
            })));
            
            // Send request to API
            fetch('http://localhost:5000/orders', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update order_id for new orders
                    if (!this.order_id && data.order_id) {
                        this.order_id = data.order_id;
                    }
                    
                    resolve(this);
                } else {
                    reject(data.message || 'Error saving order');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }
} 