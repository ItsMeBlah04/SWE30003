/**
 * SalesReport Model
 * Represents a sales report in the system
 */
class SalesReport extends BaseModel {
    /**
     * Create a new SalesReport instance
     * @param {Object} data - SalesReport data
     */
    constructor(data = {}) {
        super(data);
        
        // Set default values if not provided
        this.report_id = data.report_id || null;
        this.admin_id = data.admin_id || null;
        this.start_date = data.start_date || null;
        this.end_date = data.end_date || null;
        
        // Report data
        this.summary = data.summary || {};
        this.product_sales = data.product_sales || [];
        this.category_sales = data.category_sales || [];
        this.sales_by_date = data.sales_by_date || [];
        
        // Processed data for UI
        this.stats = this.processStats();
        this.monthlySales = this.processMonthlyData();
        this.categoryData = this.processCategoryData();
        this.topProducts = this.getTopProducts(5);
    }

    /**
     * Process statistics data for the dashboard
     * @returns {Object} Processed stats
     */
    processStats() {
        // Ensure we have a valid summary object
        const summary = this.summary || {};
        
        // Handle missing or invalid values
        const totalSales = typeof summary.total_sales !== 'undefined' && summary.total_sales !== null 
            ? Number(summary.total_sales) 
            : 0;
        
        const totalOrders = typeof summary.total_orders !== 'undefined' && summary.total_orders !== null 
            ? Number(summary.total_orders) 
            : 0;
        
        const avgOrder = typeof summary.average_order_value !== 'undefined' && summary.average_order_value !== null 
            ? Number(summary.average_order_value) 
            : (totalOrders > 0 ? totalSales / totalOrders : 0);
        
        return {
            totalRevenue: totalSales,
            totalOrders: totalOrders,
            averageOrder: avgOrder,
            conversionRate: 3.2 // Default value, would be calculated from actual visitor data
        };
    }

    /**
     * Process monthly sales data for the chart
     * @returns {Array} Monthly sales data
     */
    processMonthlyData() {
        // Create array with 12 months (default to 0)
        const monthlySales = Array(12).fill(0);
        
        // If we have sales by date, populate the monthly data
        if (this.sales_by_date && this.sales_by_date.length > 0) {
            this.sales_by_date.forEach(sale => {
                const date = new Date(sale.sale_date);
                const month = date.getMonth();
                monthlySales[month] += parseFloat(sale.total_sales);
            });
        }
        
        return monthlySales;
    }

    /**
     * Process category data for the chart
     * @returns {Object} Category data
     */
    processCategoryData() {
        const categoryData = {
            phone: 0,
            tablet: 0,
            laptop: 0,
            watch: 0,
            accessories: 0
        };
        
        // If we have category sales, populate the category data
        if (this.category_sales && this.category_sales.length > 0) {
            this.category_sales.forEach(category => {
                const categoryName = category.category.toLowerCase();
                if (categoryData.hasOwnProperty(categoryName)) {
                    categoryData[categoryName] = parseFloat(category.total_revenue);
                }
            });
        }
        
        return categoryData;
    }

    /**
     * Get total sales
     * @returns {number} Total sales amount
     */
    getTotalSales() {
        return this.summary.total_sales || 0;
    }

    /**
     * Get total orders
     * @returns {number} Total number of orders
     */
    getTotalOrders() {
        return this.summary.total_orders || 0;
    }

    /**
     * Get average order value
     * @returns {number} Average order value
     */
    getAverageOrderValue() {
        return this.summary.average_order_value || 0;
    }

    /**
     * Get top selling products
     * @param {number} limit - Number of products to return
     * @returns {Array} Top selling products
     */
    getTopProducts(limit = 5) {
        // If we don't have product sales data, return empty array
        if (!this.product_sales || this.product_sales.length === 0) {
            return [];
        }
        
        // Sort product sales by revenue (descending)
        const sortedProducts = [...this.product_sales].sort((a, b) => {
            return parseFloat(b.total_revenue) - parseFloat(a.total_revenue);
        });
        
        // Map to the format needed for the UI
        return sortedProducts.slice(0, limit).map(product => {
            return {
                name: product.name,
                category: this.getCategoryFromProduct(product),
                units: parseInt(product.total_quantity),
                revenue: parseFloat(product.total_revenue)
            };
        });
    }
    
    /**
     * Get category from product
     * @param {Object} product - Product object
     * @returns {string} Category name
     */
    getCategoryFromProduct(product) {
        // Try to get category from product object
        if (product.category) {
            return product.category.toLowerCase();
        }
        
        // Default to phone if no category found
        return 'phone';
    }

    /**
     * Get category distribution
     * @returns {Array} Category distribution data
     */
    getCategoryDistribution() {
        return this.category_sales;
    }

    /**
     * Get sales trend data
     * @returns {Object} Sales trend data
     */
    getSalesTrend() {
        // Format data for chart display
        const dates = this.sales_by_date.map(item => item.sale_date);
        const amounts = this.sales_by_date.map(item => parseFloat(item.total_sales));
        
        return {
            dates,
            amounts
        };
    }

    /**
     * Export report as PDF
     * @returns {Promise} Promise that resolves when PDF is generated
     */
    exportPDF() {
        return new Promise((resolve, reject) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                // Get report container element
                const reportContainer = document.getElementById('report-container');
                
                // Generate PDF from container element
                html2canvas(reportContainer, {
                    scale: 0.7,
                    useCORS: true,
                    logging: false
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Add image to PDF
                    const imgWidth = 210;
                    const imgHeight = canvas.height * imgWidth / canvas.width;
                    
                    doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    
                    // Save PDF
                    doc.save(`Sales_Report_${this.start_date}_to_${this.end_date}.pdf`);
                    
                    resolve({
                        success: true,
                        message: 'PDF generated successfully'
                    });
                });
            } catch (error) {
                console.error('Failed to generate PDF:', error);
                reject('Failed to generate PDF: ' + error.message);
            }
        });
    }

    /**
     * Generate a sales report
     * @param {Object} filters - Report filters
     * @returns {Promise} Promise that resolves with SalesReport instance
     */
    generate(filters = {}) {
        return new Promise((resolve, reject) => {
            // Set dates if not provided
            if (!this.start_date) {
                // Default to first day of current month
                const now = new Date();
                this.start_date = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            }
            
            if (!this.end_date) {
                // Default to current date
                this.end_date = new Date().toISOString().split('T')[0];
            }
            
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'generate_report');
            formData.append('admin_id', this.admin_id);
            formData.append('start_date', this.start_date);
            formData.append('end_date', this.end_date);
            
            // Add filters
            for (const key in filters) {
                formData.append(key, filters[key]);
            }
            
            // Send request to API
            fetch('../php/analytics.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update report data
                    this.summary = data.summary;
                    this.product_sales = data.product_sales;
                    this.category_sales = data.category_sales;
                    this.sales_by_date = data.sales_by_date;
                    
                    // Process data for UI
                    this.stats = this.processStats();
                    this.monthlySales = this.processMonthlyData();
                    this.categoryData = this.processCategoryData();
                    this.topProducts = this.getTopProducts(5);
                    
                    resolve(this);
                } else {
                    reject(data.message || 'Error generating report');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Save report to the database (create or update)
     * @returns {Promise} Promise that resolves with saved SalesReport instance
     */
    save() {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = this.toFormData();
            formData.append('action', this.report_id ? 'update_report' : 'create_report');
            
            // Send request to API
            fetch('../php/analytics.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update report_id for new reports
                    if (!this.report_id && data.report_id) {
                        this.report_id = data.report_id;
                    }
                    
                    resolve(this);
                } else {
                    reject(data.message || 'Error saving report');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }

    /**
     * Get all reports for an admin
     * @param {number} adminId - Admin ID
     * @returns {Promise} Promise that resolves with array of SalesReport instances
     */
    static getByAdminId(adminId) {
        return new Promise((resolve, reject) => {
            // Create form data for request
            const formData = new FormData();
            formData.append('action', 'get_reports_by_admin');
            formData.append('admin_id', adminId);
            
            // Send request to API
            fetch('../php/analytics.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const reports = data.reports.map(reportData => new SalesReport(reportData));
                    resolve(reports);
                } else {
                    reject(data.message || 'Error getting reports');
                }
            })
            .catch(error => {
                reject('Network error: ' + error);
            });
        });
    }
} 