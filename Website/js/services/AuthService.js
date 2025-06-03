/**
 * AuthService
 * Service class to handle authentication-related operations
 */
class AuthService {
    constructor() {
        this.apiUrl = '../php/auth.php';
        this._currentAdmin = null;
    }

    /**
     * Get current authenticated admin
     * @returns {Admin|null} Current admin or null if not authenticated
     */
    get currentAdmin() {
        // Check if we already have an admin instance
        if (this._currentAdmin && this._currentAdmin.isAuthenticated()) {
            return this._currentAdmin;
        }
        
        // Check if we have admin data in session storage
        if (sessionStorage.getItem('isAuthenticated') === 'true') {
            const adminData = {
                admin_id: sessionStorage.getItem('admin_id'),
                name: sessionStorage.getItem('admin_name'),
                email: sessionStorage.getItem('admin_email')
            };
            
            this._currentAdmin = new Admin(adminData);
            return this._currentAdmin;
        }
        
        return null;
    }

    /**
     * Login as admin
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise} Promise that resolves with Admin instance
     */
    loginAsAdmin(username, password) {
        return new Promise((resolve, reject) => {
            // Create admin instance
            const admin = new Admin({ username });
            
            // Authenticate admin
            admin.authenticate(username, password)
                .then(() => {
                    this._currentAdmin = admin;
                    resolve(admin);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /**
     * Login as customer
     * @param {string} username - Customer username
     * @param {string} password - Customer password
     * @returns {Promise} Promise that resolves with customer data
     */
    loginAsCustomer(username, password) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', username);
            formData.append('password', password);
            
            // Send login request to API
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store customer data in session storage
                    sessionStorage.setItem('customer_id', data.customer_id);
                    sessionStorage.setItem('customer_name', data.name);
                    sessionStorage.setItem('isCustomerAuthenticated', 'true');
                    
                    resolve({
                        success: true,
                        customer_id: data.customer_id,
                        name: data.name,
                        email: data.email
                    });
                } else {
                    reject(data.message || 'Login failed');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Register a new customer
     * @param {Object} customerData - Customer registration data
     * @returns {Promise} Promise that resolves with new customer data
     */
    registerCustomer(customerData) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'signup');
            formData.append('first_name', customerData.first_name);
            formData.append('last_name', customerData.last_name);
            formData.append('email', customerData.email);
            formData.append('phone', customerData.phone);
            formData.append('password', customerData.password);
            
            // Send signup request to API
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Store customer data in session storage
                    sessionStorage.setItem('customer_id', data.customer_id);
                    sessionStorage.setItem('customer_name', data.name);
                    sessionStorage.setItem('isCustomerAuthenticated', 'true');
                    
                    resolve({
                        success: true,
                        customer_id: data.customer_id,
                        name: data.name
                    });
                } else {
                    reject(data.message || 'Signup failed');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Logout current admin
     */
    logout() {
        if (this._currentAdmin) {
            this._currentAdmin.logout();
            this._currentAdmin = null;
        } else {
            // Clear session storage
            sessionStorage.removeItem('admin_id');
            sessionStorage.removeItem('admin_name');
            sessionStorage.removeItem('admin_email');
            sessionStorage.removeItem('isAuthenticated');
            sessionStorage.removeItem('customer_id');
            sessionStorage.removeItem('customer_name');
            sessionStorage.removeItem('isCustomerAuthenticated');
            
            // Redirect to login page
            window.location.href = '../html/login_signup.html';
        }
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    isAuthenticated() {
        return this.currentAdmin !== null || sessionStorage.getItem('isCustomerAuthenticated') === 'true';
    }

    /**
     * Check if current page requires authentication and redirect if not authenticated
     */
    checkAuthRequired() {
        // Get current page path
        const currentPath = window.location.pathname;
        
        // List of paths that require authentication
        const authRequiredPaths = [
            '/admin_products.html',
            '/admin_analytics.html'
        ];
        
        // Check if current path requires authentication
        const requiresAuth = authRequiredPaths.some(path => currentPath.includes(path));
        
        if (requiresAuth && !this.isAuthenticated()) {
            // Redirect to login page
            window.location.href = '../html/login_signup.html?redirect=' + encodeURIComponent(currentPath);
        }
    }
} 