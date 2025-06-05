/**
 * AnalyticsService
 * Service class to handle analytics-related operations
 */
class AnalyticsService {
    /**
     * Initialize the AnalyticsService
     */
    constructor() {
        this.apiUrl = '../php/analytics.php';
    }

    /**
     * Make an API request to the analytics endpoint
     * @param {string} action - The action to perform
     * @param {Object} data - Additional data to send
     * @returns {Promise} Promise that resolves with the response
     * @private
     */
    makeRequest(action, data = {}) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', action);
            
            // Add additional data
            for (const key in data) {
                formData.append(key, data[key]);
            }
            
            console.log(`Making ${action} request with data:`, data);
            
            // Send request to API
            fetch(this.apiUrl, {
                method: 'POST',
                body: formData,
                // Add timeout to avoid hanging requests
                signal: AbortSignal.timeout(30000) // 30 second timeout
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(text => {
                try {
                    // Try to parse response as JSON
                    if (!text || text.trim() === '') {
                        throw new Error('Empty response received');
                    }
                    
                    console.log(`Raw response for ${action}:`, text.length > 100 ? text.substring(0, 100) + '...' : text);
                    
                    const data = JSON.parse(text);
                    console.log(`${action} response parsed:`, data);
                    
                    if (data.success) {
                        resolve(data);
                    } else {
                        reject(data.message || `Error in ${action}`);
                    }
                } catch (e) {
                    console.error('Failed to parse response as JSON:', e);
                    console.error('Response text (first 200 chars):', text ? text.substring(0, 200) : 'empty');
                    reject(`Server returned invalid JSON: ${e.message}`);
                }
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.error(`Request ${action} timed out after 30 seconds`);
                    reject('Request timed out. Server may be busy or unresponsive.');
                } else {
                    console.error(`Error in ${action}:`, error);
                    reject(`Network error: ${error.message}`);
                }
            });
        });
    }

    /**
     * Get sales summary for specified date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise} Promise that resolves with sales summary
     */
    getSalesSummary(startDate, endDate) {
        return this.makeRequest('sales_summary', {
            start_date: startDate,
            end_date: endDate
        });
    }

    /**
     * Get product sales for specified date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @param {string} category - Optional category filter
     * @returns {Promise} Promise that resolves with product sales
     */
    getProductSales(startDate, endDate, category = null) {
        const data = {
            start_date: startDate,
            end_date: endDate
        };
        
        if (category && category !== 'all') {
            data.category = category;
        }
        
        return this.makeRequest('product_sales', data);
    }

    /**
     * Get category sales for specified date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise} Promise that resolves with category sales
     */
    getCategorySales(startDate, endDate) {
        return this.makeRequest('category_sales', {
            start_date: startDate,
            end_date: endDate
        });
    }

    /**
     * Get sales by date for specified date range
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise} Promise that resolves with sales by date
     */
    getSalesByDate(startDate, endDate) {
        return this.makeRequest('sales_by_date', {
            start_date: startDate,
            end_date: endDate
        });
    }

    /**
     * Process daily sales data into monthly totals
     * Follows the exact logic shown in the specification
     * @param {Array} salesByDate - Array of daily sales data
     * @returns {Array} Array of monthly totals
     */
    processMonthlyData(salesByDate = []) {
        // Create array with 12 months (default to 0)
        const monthlySales = new Array(12).fill(0);
        
        // If we have sales by date, populate the monthly data
        if (salesByDate && salesByDate.length > 0) {
            salesByDate.forEach(sale => {
                // Parse the date
                const date = new Date(sale.sale_date);
                // Get the month (0-11)
                const month = date.getMonth();
                // Add the sales to the monthly total
                monthlySales[month] += parseFloat(sale.total_sales);
            });
        }
        
        return monthlySales;
    }

    /**
     * Generate a complete sales report
     * @param {Object} filters - Report filters (month, year, category)
     * @returns {Promise} Promise that resolves with sales report
     */
    generateSalesReport(filters = {}) {
        return new Promise((resolve, reject) => {
            // Get current admin
            const authService = new AuthService();
            const admin = authService.currentAdmin;
            
            // Calculate date range based on filters
            const dateRange = this.calculateDateRange(filters);
            const startDate = dateRange.startDate;
            const endDate = dateRange.endDate;
            
            console.log('Generating report with date range:', startDate, 'to', endDate);
            
            // Make a single request to generate the complete report
            this.makeRequest('generate_report', {
                admin_id: admin ? admin.admin_id : null,
                start_date: startDate,
                end_date: endDate,
                category: filters.category || 'all'
            })
            .then(data => {
                console.log('Report data received:', data);
                
                // Check if we have minimal data required
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid response format');
                }
                
                // Create a sales report from the response
                const report = new SalesReport({
                    admin_id: data.admin_id || (admin ? admin.admin_id : null),
                    start_date: data.start_date || startDate,
                    end_date: data.end_date || endDate,
                    summary: data.summary,
                    product_sales: data.product_sales,
                    category_sales: data.category_sales,
                    sales_by_date: data.sales_by_date
                });
                
                console.log('Sales report object created:', report);
                resolve(report);
            })
            .catch(error => {
                console.error('Failed to generate report:', error);
                reject(`Failed to generate report: ${error}`);
            });
        });
    }

    /**
     * Calculate date range based on filters
     * @param {Object} filters - Report filters (month, year, category)
     * @returns {Object} Date range object with startDate and endDate
     */
    calculateDateRange(filters = {}) {
        let startDate, endDate;
        
        // If month filter is set
        if (filters.month && filters.month !== 'all') {
            // Use the year from filters or default to current year
            const month = parseInt(filters.month) - 1; // JavaScript months are 0-11
            const year = filters.year ? parseInt(filters.year) : 2024; // Default to 2024
            
            // Start date is first day of month
            startDate = new Date(year, month, 1);
            
            // End date is last day of month
            endDate = new Date(year, month + 1, 0);
        } else {
            // If year filter is set
            if (filters.year && filters.year !== 'all') {
                const year = parseInt(filters.year);
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31);
            } else {
                // Default to 2024 if no specific filters
                const year = 2024;
                startDate = new Date(year, 0, 1);  // Jan 1, 2024
                endDate = new Date(year, 11, 31);  // Dec 31, 2024
            }
        }
        
        // Format dates for API
        return {
            startDate: this.formatDate(startDate),
            endDate: this.formatDate(endDate)
        };
    }
    
    /**
     * Format date as YYYY-MM-DD
     * @param {Date} date - Date to format
     * @returns {string} Formatted date
     * @private
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
} 