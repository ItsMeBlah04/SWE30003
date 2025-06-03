/**
 * Base Model Class
 * Provides common functionality for all models
 */
class BaseModel {
    constructor(data = {}) {
        // Copy data properties to this instance
        Object.assign(this, data);
    }

    /**
     * Convert model to JSON string
     * @returns {string} JSON representation of model
     */
    toJSON() {
        return JSON.stringify(this);
    }

    /**
     * Convert model to FormData object for API requests
     * @returns {FormData} FormData object with model properties
     */
    toFormData() {
        const formData = new FormData();
        
        // Add all properties to form data
        for (const key in this) {
            // Skip functions and internal properties
            if (typeof this[key] !== 'function' && !key.startsWith('_')) {
                formData.append(key, this[key]);
            }
        }
        
        return formData;
    }
} 