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
        if (!this.name) {
            return { success: false, message: 'Product name is required' };
        }
        
        if (isNaN(parseFloat(this.price)) || parseFloat(this.price) < 0) {
            return { success: false, message: 'Price must be a valid number greater than or equal to 0' };
        }
        
        if (isNaN(parseInt(this.stock)) || parseInt(this.stock) < 0) {
            return { success: false, message: 'Stock must be a valid number greater than or equal to 0' };
        }
        
        return { success: true };
    }
} 