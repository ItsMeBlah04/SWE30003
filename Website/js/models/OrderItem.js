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
} 