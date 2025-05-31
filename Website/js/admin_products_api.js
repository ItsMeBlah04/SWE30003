/**
 * Admin Products API Interface
 * This file connects the admin_products.js frontend with the Python backend
 */

// API endpoints - update this to match your Python server configuration
const API_URL = 'http://localhost:5000/admin_update_product';

// Replace or modify these functions in admin_products.js

/**
 * Load all products from the database
 * @returns {Promise} Promise that resolves with the products array
 */
function loadProducts() {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('action', 'get_all');
        
        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resolve(data.products);
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
 * Get a single product by ID
 * @param {number} id - The product ID
 * @returns {Promise} Promise that resolves with the product object
 */
function getProduct(id) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('action', 'get_product');
        formData.append('id', id);
        
        fetch(API_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                resolve(data.product);
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
 * Save a product (create new or update existing)
 * @param {Object} product - The product object to save
 * @param {boolean} isUpdate - Whether this is an update (true) or create (false)
 * @returns {Promise} Promise that resolves with the saved product
 */
function saveProduct(product, isUpdate) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('action', isUpdate ? 'update' : 'create');
        
        // Add all product fields to the form data
        for (const key in product) {
            formData.append(key, product[key]);
        }
        
        fetch(API_URL, {
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
 * @param {number} id - The product ID to delete
 * @returns {Promise} Promise that resolves when the product is deleted
 */
function deleteProduct(id) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('id', id);
        
        fetch(API_URL, {
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

// Example of how to integrate with the existing admin_products.js

// 1. Replace the products array with data from the API
document.addEventListener('DOMContentLoaded', function() {
    // Load products from the database instead of using the hardcoded array
    loadProducts()
        .then(loadedProducts => {
            products = loadedProducts; // Replace the hardcoded products array
            displayProducts();         // Use the existing function to display them
        })
        .catch(error => {
            console.error('Failed to load products:', error);
            // Display error message to user
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = `<div class="error">Failed to load products: ${error}</div>`;
            }
        });
});

// 2. Modify the saveProduct function in admin_products.js to use the API
// Replace with this:
/*
function saveProduct(e) {
    e.preventDefault();
    
    const productData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-description').value
    };
    
    const isUpdate = currentProductId !== null;
    
    if (isUpdate) {
        productData.id = currentProductId;
    }
    
    saveProduct(productData, isUpdate)
        .then(savedProduct => {
            if (isUpdate) {
                // Update existing product in the array
                const index = products.findIndex(p => p.id === currentProductId);
                if (index !== -1) {
                    products[index] = savedProduct;
                }
            } else {
                // Add new product to the array
                products.push(savedProduct);
            }
            
            hideProductForm();
            displayProducts();
            
            // Show success message
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = `<div class="success">Product ${isUpdate ? 'updated' : 'created'} successfully</div>`;
                setTimeout(() => {
                    messageContainer.innerHTML = '';
                }, 3000);
            }
        })
        .catch(error => {
            // Show error message
            const messageContainer = document.getElementById('message-container');
            if (messageContainer) {
                messageContainer.innerHTML = `<div class="error">${error}</div>`;
                setTimeout(() => {
                    messageContainer.innerHTML = '';
                }, 5000);
            }
        });
}
*/

// 3. Replace the deleteConfirmed function to use the API
// Replace with this:
/*
function deleteConfirmed() {
    if (currentProductId) {
        deleteProduct(currentProductId)
            .then(() => {
                // Remove from local array
                products = products.filter(p => p.id !== currentProductId);
                displayProducts();
                hideDeleteModal();
                
                // Show success message
                const messageContainer = document.getElementById('message-container');
                if (messageContainer) {
                    messageContainer.innerHTML = '<div class="success">Product deleted successfully</div>';
                    setTimeout(() => {
                        messageContainer.innerHTML = '';
                    }, 3000);
                }
            })
            .catch(error => {
                hideDeleteModal();
                
                // Show error message
                const messageContainer = document.getElementById('message-container');
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="error">${error}</div>`;
                    setTimeout(() => {
                        messageContainer.innerHTML = '';
                    }, 5000);
                }
            });
    }
}
*/ 