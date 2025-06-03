/**
 * ProductService
 * Service class to handle product-related operations
 */
class ProductService {
    constructor() {
        this.apiUrl = '../php/products.php';
    }

    /**
     * Get all products
     * @returns {Promise} Promise that resolves with array of Product instances
     */
    getAllProducts() {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('action', 'get_all');
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const products = data.products.map(productData => new Product(productData));
                    resolve(products);
                } else {
                    reject(data.message || 'Error loading products');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Get a product by ID
     * @param {number} id - Product ID
     * @returns {Promise} Promise that resolves with Product instance
     */
    getProductById(id) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('action', 'get_product');
            formData.append('id', id);
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const product = new Product(data.product);
                    resolve(product);
                } else {
                    reject(data.message || 'Error getting product');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Save a product (create or update)
     * @param {Product} product - Product instance to save
     * @returns {Promise} Promise that resolves with saved Product instance
     */
    saveProduct(product) {
        return new Promise((resolve, reject) => {
            // Validate product
            const validation = product.validate();
            if (!validation.success) {
                reject(validation.message);
                return;
            }
            
            const isUpdate = product.id !== null;
            
            // Create form data for request
            const formData = product.toFormData();
            formData.append('action', isUpdate ? 'update' : 'create');
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // For new products, add the new ID to the product object
                    if (!isUpdate && data.id) {
                        product.id = data.id;
                    }
                    
                    resolve(product);
                } else {
                    reject(data.message || 'Error saving product');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Delete a product
     * @param {number} id - Product ID to delete
     * @returns {Promise} Promise that resolves when product is deleted
     */
    deleteProduct(id) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('id', id);
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve();
                } else {
                    reject(data.message || 'Error deleting product');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Get products by category
     * @param {string} category - Product category
     * @returns {Promise} Promise that resolves with array of Product instances
     */
    getProductsByCategory(category) {
        return new Promise((resolve, reject) => {
            this.getAllProducts()
                .then(products => {
                    const filteredProducts = products.filter(product => product.category === category);
                    resolve(filteredProducts);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Search products by name or description
     * @param {string} query - Search query
     * @returns {Promise} Promise that resolves with array of Product instances
     */
    searchProducts(query) {
        return new Promise((resolve, reject) => {
            this.getAllProducts()
                .then(products => {
                    const searchQuery = query.toLowerCase();
                    const filteredProducts = products.filter(product => {
                        return product.name.toLowerCase().includes(searchQuery) || 
                               (product.description && product.description.toLowerCase().includes(searchQuery));
                    });
                    resolve(filteredProducts);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
} 