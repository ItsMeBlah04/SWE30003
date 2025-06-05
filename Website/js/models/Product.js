/**
 * Product Model
 * Represents a product in the system
 */
class Product extends BaseModel {
    /**
     * Create a new Product instance
     * @param {Object} data - Product data
     */
    constructor(data = {}) {
        super(data);
        
        // Set default values if not provided
        this.id = data.product_id || data.id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.price = data.price || 0;
        this.stock = data.stock || 0;
        this.category = data.category || '';
        this.image = data.image || '';
        this.barcode = data.barcode || '';
        this.serial_number = data.serial_number || '';
        this.manufacter = data.manufacter || ''; // Note: This is the field name from the database
    }

    /**
     * Validate product data
     * @returns {Object} Validation result with success and message
     */
    validate() {
        // Validate name
        if (!this.name || this.name.trim() === '') {
            return { success: false, message: 'Product name is required and cannot be empty' };
        }
        
        if (this.name.trim().length < 2) {
            return { success: false, message: 'Product name must be at least 2 characters long' };
        }
        
        if (this.name.length > 100) {
            return { success: false, message: 'Product name cannot exceed 100 characters' };
        }
        
        // Validate category
        if (!this.category || this.category.trim() === '') {
            return { success: false, message: 'Product category is required' };
        }
        
        // Validate price
        const price = parseFloat(this.price);
        if (isNaN(price)) {
            return { success: false, message: 'Price must be a valid number' };
        }
        
        if (price <= 0) {
            return { success: false, message: 'Price must be greater than $0.00' };
        }
        
        if (price > 999999.99) {
            return { success: false, message: 'Price cannot exceed $999,999.99' };
        }
        
        // Validate stock
        const stock = parseInt(this.stock);
        if (isNaN(stock)) {
            return { success: false, message: 'Stock quantity must be a valid number' };
        }
        
        if (stock < 0) {
            return { success: false, message: 'Stock quantity cannot be negative' };
        }
        
        if (stock > 999999) {
            return { success: false, message: 'Stock quantity cannot exceed 999,999' };
        }
        
        // Validate description length (optional field)
        if (this.description && this.description.length > 1000) {
            return { success: false, message: 'Description cannot exceed 1000 characters' };
        }
        
        return { success: true };
    }
} 