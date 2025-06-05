/**
 * Admin Model
 * Represents an administrator in the system
 */
class Admin extends BaseModel {
    /**
     * Create a new Admin instance
     * @param {Object} data - Admin data
     */
    constructor(data = {}) {
        super(data);
        
        // Set default values if not provided
        this.admin_id = data.admin_id || null;
        this.name = data.name || '';
        this.email = data.email || '';
        
        // Authentication properties (not stored in Admin table)
        this._username = data.username || '';
        this._password = ''; // We never store the password in memory
        this._isAuthenticated = false;
    }

    /**
     * Authenticate admin with username and password
     * @param {string} username - Admin username
     * @param {string} password - Admin password
     * @returns {Promise} Promise that resolves with authentication result
     */
    authenticate(username, password) {
        return new Promise((resolve, reject) => {
            // Create form data for authentication request
            const formData = new FormData();
            formData.append('action', 'admin_login');
            formData.append('username', username);
            formData.append('password', password);
            
            // Send authentication request to API
            fetch('../php/auth.php', {
                method: 'POST',
                body: formData,
                // Add timeout to avoid hanging requests
                signal: AbortSignal.timeout(10000) // 10 second timeout
            })
            .then(response => {
                // Check if response is OK
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // First get the text
                return response.text();
            })
            .then(text => {
                // Check if text is empty
                if (!text || text.trim() === '') {
                    throw new Error('Empty response from server');
                }
                
                // Try to parse as JSON
                try {
                    return JSON.parse(text);
                } catch (e) {
                    console.error('Failed to parse response as JSON:', text);
                    throw new Error('Server returned invalid JSON. Check console for details.');
                }
            })
            .then(data => {
                if (data && data.success) {
                    // Store admin data
                    this.admin_id = data.admin_id;
                    this.name = data.name || username;
                    this.email = data.email || '';
                    this._username = username;
                    this._isAuthenticated = true;
                    
                    // Store session data
                    sessionStorage.setItem('admin_id', data.admin_id);
                    sessionStorage.setItem('admin_name', this.name);
                    sessionStorage.setItem('admin_email', this.email);
                    sessionStorage.setItem('isAuthenticated', 'true');
                    
                    resolve({ success: true });
                } else {
                    this._isAuthenticated = false;
                    reject(data?.message || 'Authentication failed');
                }
            })
            .catch(error => {
                this._isAuthenticated = false;
                console.error('Authentication error:', error);
                
                if (error.name === 'AbortError') {
                    reject('Request timed out. Server may be busy or unresponsive.');
                } else {
                    reject(error.message || 'Network error during authentication');
                }
            });
        });
    }

    /**
     * Check if admin is authenticated
     * @returns {boolean} True if authenticated, false otherwise
     */
    isAuthenticated() {
        // Check session storage first
        if (sessionStorage.getItem('isAuthenticated') === 'true') {
            this._isAuthenticated = true;
            this.admin_id = sessionStorage.getItem('admin_id');
            this.name = sessionStorage.getItem('admin_name');
            this.email = sessionStorage.getItem('admin_email');
        }
        
        return this._isAuthenticated;
    }

    /**
     * Log out admin
     */
    logout() {
        this._isAuthenticated = false;
        this.admin_id = null;
        this.name = '';
        this.email = '';
        
        // Clear session storage
        sessionStorage.removeItem('admin_id');
        sessionStorage.removeItem('admin_name');
        sessionStorage.removeItem('admin_email');
        sessionStorage.removeItem('isAuthenticated');
        
        // Redirect to login page
        window.location.href = '../html/login_signup.html';
    }
} 