/**
 * ProductService
 * Service class to handle product-related operations
 */
class ProductService {
    constructor() {
        this.apiUrl = '../php/productHandle.php';
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
                    const products = data.products.map(productData => {
                        const product = new Product(productData);
                        // Ensure ID is set correctly from product_id
                        product.id = productData.product_id || productData.id;
                        return product;
                    });
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
        console.log('ProductService: Getting product by ID:', id);
        
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('action', 'get_product');
            formData.append('id', id);
            
            console.log('ProductService: Sending request to:', this.apiUrl);
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('ProductService: Response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('ProductService: Response data:', data);
                
                if (data.success) {
                    const product = new Product(data.product);
                    // Ensure id is set correctly
                    product.id = data.product.product_id || data.product.id;
                    console.log('ProductService: Product created:', product);
                    resolve(product);
                } else {
                    console.error('ProductService: Error from server:', data.message);
                    reject(data.message || 'Error getting product');
                }
            })
            .catch(error => {
                console.error('ProductService: Network error:', error);
                reject('Network error: ' + error.message);
            });
        });
    }

    /**
     * Save a product (create or update)
     * @param {Product} product - Product instance to save
     * @returns {Promise} Promise that resolves with saved Product instance
     */
    saveProduct(product) {
        console.log('ProductService: Saving product:', product);
        
        return new Promise((resolve, reject) => {
            // Validate product
            const validation = product.validate();
            if (!validation.success) {
                console.error('ProductService: Validation failed:', validation.message);
                reject(validation.message);
                return;
            }
            
            const isUpdate = product.id !== null && product.id !== undefined && product.id !== '';
            console.log('ProductService: Is update operation:', isUpdate);
            
            // Create form data for request
            const formData = product.toFormData();
            formData.append('action', isUpdate ? 'update' : 'create');
            
            // Log the form data being sent
            console.log('ProductService: Form data to send:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`);
            }
            
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log('ProductService: Save response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('ProductService: Save response data:', data);
                
                if (data.success) {
                    // For new products, add the new ID to the product object
                    if (!isUpdate && data.id) {
                        product.id = data.id;
                        console.log('ProductService: New product ID assigned:', data.id);
                    }
                    
                    resolve(product);
                } else {
                    console.error('ProductService: Save error from server:', data.message);
                    reject(data.message || 'Error saving product');
                }
            })
            .catch(error => {
                console.error('ProductService: Network error during save:', error);
                reject('Network error: ' + error.message);
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