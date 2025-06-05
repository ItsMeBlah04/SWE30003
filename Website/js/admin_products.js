/**
 * AdminProductsManager Class
 * Manages product administration operations using OOP principles
 */
class AdminProductsManager {
    constructor() {
        // Initialize services
        this.productService = new ProductService();
        this.authService = new AuthService();
        
        // DOM Elements
        this.productForm = document.getElementById('product-form');
        this.productList = document.getElementById('product-list');
        this.addProductBtn = document.getElementById('add-product-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.formTitle = document.getElementById('form-title');
        this.saveBtn = document.getElementById('save-btn');
        this.deleteModal = document.getElementById('delete-modal');
        this.closeModal = document.getElementById('close-modal');
        this.cancelDelete = document.getElementById('cancel-delete');
        this.confirmDelete = document.getElementById('confirm-delete');
        this.messageContainer = document.getElementById('message-container');
        
        // State properties
        this.products = [];
        this.currentProductId = null;
        this.isEditMode = false;
    }

    /**
     * Initialize the product manager
     */
    init() {
        console.log('AdminProductsManager: Initializing...');
        
        // Check if user is authenticated
        this.authService.checkAuthRequired();
        
        // Setup UI based on authentication
        this.setupUI();
        
        // Load products
        this.loadProducts();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Add debug information
        this.debugSetup();
        
        console.log('AdminProductsManager: Initialization complete');
    }

    /**
     * Setup UI based on authentication
     */
    setupUI() {
        const admin = this.authService.currentAdmin;
        
        if (admin) {
            // Show admin name if available
            const adminNameElement = document.getElementById('admin-name');
            if (adminNameElement) {
                adminNameElement.textContent = admin.name;
            }
            
            // Setup logout button
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.authService.logout();
                });
            }
        }
    }

    /**
     * Load products from the database
     */
    loadProducts() {
        console.log('AdminProductsManager: Loading products...');
        
        // Show loading indicator
        this.productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading products...</td></tr>';
        
        this.productService.getAllProducts()
            .then(loadedProducts => {
                this.products = loadedProducts;
                this.displayProducts();
                console.log('AdminProductsManager: Products loaded successfully');
            })
            .catch(error => {
                console.error('AdminProductsManager: Failed to load products:', error);
                this.showMessage('Failed to load products: ' + error, false);
                this.productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load products</td></tr>';
            });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        console.log('AdminProductsManager: Setting up event listeners...');
        
        this.addProductBtn.addEventListener('click', () => this.showAddProductForm());
        this.cancelBtn.addEventListener('click', () => this.hideProductForm());
        
        // Fix form submission handling
        const productFormElement = document.getElementById('productForm');
        productFormElement.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct(e);
        });
        
        this.closeModal.addEventListener('click', () => this.hideDeleteModal());
        this.cancelDelete.addEventListener('click', () => this.hideDeleteModal());
        this.confirmDelete.addEventListener('click', () => this.deleteConfirmed());
        
        // Image preview - always use default.png
        document.getElementById('product-image').addEventListener('input', (e) => {
            const previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = '';
            
            // Always show default.png
            const img = document.createElement('img');
            img.src = '../images/default.png';
            img.className = 'image-preview';
            previewContainer.appendChild(img);
        });
    }

    /**
     * Display all products in table
     */
    displayProducts() {
        console.log('AdminProductsManager: Displaying products...');
        
        this.productList.innerHTML = '';
        
        if (this.products.length === 0) {
            this.productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>';
            return;
        }
        
        this.products.forEach(product => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${product.id}</td>
                <td><img src="../images/default.png" alt="${product.name}" width="50" height="50"></td>
                <td>${product.name}</td>
                <td>${this.capitalizeFirstLetter(product.category || '')}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.stock}</td>
                <td class="btn-group">
                    <button class="btn-action btn-edit-product" data-id="${product.id}">Edit</button>
                    <button class="btn-action btn-delete" data-id="${product.id}">Delete</button>
                </td>
            `;
            
            this.productList.appendChild(row);
        });
        
        // Add event listeners to buttons - use more specific selectors
        document.querySelectorAll('.btn-edit-product').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(e.target.getAttribute('data-id'));
                console.log('Edit button clicked for product ID:', id);
                this.editProduct(id);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(e.target.getAttribute('data-id'));
                console.log('Delete button clicked for product ID:', id);
                this.showDeleteModal(id);
            });
        });
    }

    /**
     * Show form to add a new product
     */
    showAddProductForm() {
        console.log('AdminProductsManager: Showing add product form');
        
        // Reset form completely
        document.getElementById('productForm').reset();
        
        // Clear all form fields explicitly
        document.getElementById('product-id').value = '';
        document.getElementById('product-name').value = '';
        document.getElementById('product-category').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-stock').value = '';
        document.getElementById('product-image').value = '';
        document.getElementById('product-description').value = '';
        document.getElementById('image-preview-container').innerHTML = '';
        
        // Set proper state for new product
        this.formTitle.textContent = 'Add New Product';
        this.currentProductId = null;
        this.isEditMode = false;
        
        // Show form and set button text
        this.productForm.style.display = 'block';
        this.saveBtn.textContent = 'Add Product';
        this.saveBtn.disabled = false;
        
        console.log('AdminProductsManager: Add form state - ID:', this.currentProductId, 'Edit mode:', this.isEditMode);
    }

    /**
     * Hide product form
     */
    hideProductForm() {
        console.log('AdminProductsManager: Hiding product form');
        
        this.productForm.style.display = 'none';
        this.currentProductId = null;
        this.isEditMode = false;
    }

    /**
     * Edit an existing product
     * @param {number} id - Product ID to edit
     */
    editProduct(id) {
        console.log('AdminProductsManager: Edit product called with ID:', id);
        
        // Show loading in form
        this.formTitle.textContent = 'Loading...';
        this.productForm.style.display = 'block';
        this.isEditMode = true;
        
        // Disable all form inputs while loading
        const formInputs = this.productForm.querySelectorAll('input, select, textarea, button');
        formInputs.forEach(input => input.disabled = true);
        
        this.productService.getProductById(id)
            .then(product => {
                console.log('AdminProductsManager: Product loaded for editing:', product);
                
                this.formTitle.textContent = 'Edit Product';
                this.currentProductId = product.id;
                
                // Populate form fields
                document.getElementById('product-id').value = product.id || '';
                document.getElementById('product-name').value = product.name || '';
                document.getElementById('product-category').value = product.category || '';
                document.getElementById('product-price').value = product.price || '';
                document.getElementById('product-stock').value = product.stock || '';
                document.getElementById('product-image').value = product.image || '';
                document.getElementById('product-description').value = product.description || '';
                
                // Show image preview
                const previewContainer = document.getElementById('image-preview-container');
                previewContainer.innerHTML = '';
                
                // Always use default.png for preview
                const img = document.createElement('img');
                img.src = '../images/default.png';
                img.className = 'image-preview';
                previewContainer.appendChild(img);
                
                this.saveBtn.textContent = 'Save Changes';
                
                // Re-enable form inputs
                formInputs.forEach(input => input.disabled = false);
                
                console.log('AdminProductsManager: Form populated successfully');
            })
            .catch(error => {
                console.error('AdminProductsManager: Error loading product for edit:', error);
                this.hideProductForm();
                this.showMessage('Error loading product: ' + error, false);
                this.isEditMode = false;
            });
    }

    /**
     * Validate product form data
     * @param {string} name - Product name
     * @param {string} category - Product category
     * @param {string} price - Product price (as string)
     * @param {string} stock - Product stock (as string)
     * @param {string} description - Product description
     * @returns {Object} Validation result with success and message
     */
    validateProductData(name, category, price, stock, description) {
        // Trim whitespace
        name = name.trim();
        description = description.trim();
        
        // Check required fields
        if (!name) {
            return { success: false, message: 'Product name is required and cannot be empty' };
        }
        
        if (name.length < 2) {
            return { success: false, message: 'Product name must be at least 2 characters long' };
        }
        
        if (name.length > 100) {
            return { success: false, message: 'Product name cannot exceed 100 characters' };
        }
        
        if (!category) {
            return { success: false, message: 'Product category is required' };
        }
        
        // Validate price
        if (!price || price.toString().trim() === '') {
            return { success: false, message: 'Price is required' };
        }
        
        const priceNum = parseFloat(price);
        if (isNaN(priceNum)) {
            return { success: false, message: 'Price must be a valid number' };
        }
        
        if (priceNum <= 0) {
            return { success: false, message: 'Price must be greater than $0.00' };
        }
        
        if (priceNum > 999999.99) {
            return { success: false, message: 'Price cannot exceed $999,999.99' };
        }
        
        // Validate stock
        if (!stock && stock !== '0') {
            return { success: false, message: 'Stock quantity is required' };
        }
        
        const stockNum = parseInt(stock);
        if (isNaN(stockNum)) {
            return { success: false, message: 'Stock quantity must be a valid number' };
        }
        
        if (stockNum < 0) {
            return { success: false, message: 'Stock quantity cannot be negative' };
        }
        
        if (stockNum > 999999) {
            return { success: false, message: 'Stock quantity cannot exceed 999,999' };
        }
        
        // Validate description length (optional field)
        if (description && description.length > 1000) {
            return { success: false, message: 'Description cannot exceed 1000 characters' };
        }
        
        return { success: true };
    }

    /**
     * Save product (add new or update existing)
     * @param {Event} e - Form submission event
     */
    saveProduct(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log('AdminProductsManager: Save product called, edit mode:', this.isEditMode, 'current ID:', this.currentProductId);
        
        // Get form data
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const price = document.getElementById('product-price').value;
        const stock = document.getElementById('product-stock').value;
        const image = document.getElementById('product-image').value;
        const description = document.getElementById('product-description').value;
        
        // Validate form data using comprehensive validation
        const validation = this.validateProductData(name, category, price, stock, description);
        if (!validation.success) {
            this.showMessage(validation.message, false);
            console.log('AdminProductsManager: Validation failed:', validation.message);
            return;
        }
        
        // Create product instance from validated form data
        const productData = {
            id: this.currentProductId, // This should be null for new products
            name: name.trim(),
            category: category,
            price: parseFloat(price),
            stock: parseInt(stock),
            image: image.trim(),
            description: description.trim()
        };
        
        console.log('AdminProductsManager: Product data to save:', productData);
        console.log('AdminProductsManager: Is this a new product?', productData.id === null);
        
        const product = new Product(productData);
        
        // Disable the save button while processing
        this.saveBtn.disabled = true;
        this.saveBtn.textContent = this.currentProductId ? 'Saving...' : 'Adding...';
        
        // Save product
        this.productService.saveProduct(product)
            .then(savedProduct => {
                console.log('AdminProductsManager: Product saved successfully:', savedProduct);
                this.hideProductForm();
                this.showMessage(this.currentProductId ? 'Product updated successfully!' : 'Product created successfully!', true);
                
                // Reset state
                this.currentProductId = null;
                this.isEditMode = false;
                
                // Reload products from the server to ensure data consistency
                this.loadProducts();
            })
            .catch(error => {
                console.error('AdminProductsManager: Error saving product:', error);
                this.saveBtn.disabled = false;
                this.saveBtn.textContent = this.currentProductId ? 'Save Changes' : 'Add Product';
                this.showMessage('Error saving product: ' + error, false);
            });
    }

    /**
     * Show delete confirmation modal
     * @param {number} id - Product ID to delete
     */
    showDeleteModal(id) {
        console.log('AdminProductsManager: Showing delete modal for product ID:', id);
        
        this.currentProductId = id;
        this.deleteModal.style.display = 'flex';
    }

    /**
     * Hide delete confirmation modal
     */
    hideDeleteModal() {
        console.log('AdminProductsManager: Hiding delete modal');
        
        this.deleteModal.style.display = 'none';
        this.currentProductId = null;
    }

    /**
     * Delete product after confirmation
     */
    deleteConfirmed() {
        if (this.currentProductId) {
            console.log('AdminProductsManager: Deleting product ID:', this.currentProductId);
            
            // Show loading state
            this.confirmDelete.textContent = 'Deleting...';
            this.confirmDelete.disabled = true;
            
            this.productService.deleteProduct(this.currentProductId)
                .then(() => {
                    console.log('AdminProductsManager: Product deleted successfully');
                    this.hideDeleteModal();
                    this.showMessage('Product deleted successfully', true);
                    
                    // Reload products
                    this.loadProducts();
                })
                .catch(error => {
                    console.error('AdminProductsManager: Error deleting product:', error);
                    this.hideDeleteModal();
                    this.showMessage(error, false);
                })
                .finally(() => {
                    this.confirmDelete.textContent = 'Delete';
                    this.confirmDelete.disabled = false;
                });
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message to display
     * @param {boolean} isSuccess - Whether the message is a success message
     */
    showMessage(message, isSuccess) {
        console.log('AdminProductsManager: Showing message:', message, 'Success:', isSuccess);
        
        this.messageContainer.innerHTML = `<div class="${isSuccess ? 'success' : 'error'}">${message}</div>`;
        setTimeout(() => {
            this.messageContainer.innerHTML = '';
        }, isSuccess ? 3000 : 5000);
    }

    /**
     * Helper function to capitalize first letter
     * @param {string} string - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Debug setup to help troubleshoot issues
     */
    debugSetup() {
        console.log('AdminProductsManager: Debug info');
        console.log('- Product form element:', this.productForm);
        console.log('- Add product button:', this.addProductBtn);
        console.log('- Save button:', this.saveBtn);
        console.log('- Form title:', this.formTitle);
        
        // Add debugging to the add product button
        this.addProductBtn.addEventListener('click', () => {
            console.log('DEBUG: Add product button clicked');
        });
        
        // Add debugging to the save button specifically
        this.saveBtn.addEventListener('click', (e) => {
            console.log('DEBUG: Save button clicked directly');
            console.log('DEBUG: Current state - ID:', this.currentProductId, 'Edit mode:', this.isEditMode);
        });
    }
}

// Initialize the AdminProductsManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const adminProductsManager = new AdminProductsManager();
    adminProductsManager.init();
}); 