// Initialize services
const analyticsService = new AnalyticsService();
const authService = new AuthService();

/**
 * DashboardManager Class
 * Manages the Sales Analytics Dashboard functionality
 */
class DashboardManager {
  /**
   * Initialize dashboard manager
   */
  constructor() {
    // Chart objects
    this.salesChart = null;
    this.categoryChart = null;
    
    // Current report data
    this.currentReport = null;
    
    // Initialize with key DOM elements
    this.elements = {
      totalRevenue: document.getElementById('total-revenue'),
      totalOrders: document.getElementById('total-orders'),
      avgOrder: document.getElementById('avg-order'),
      conversionRate: document.getElementById('conversion-rate'),
      topProductsTable: document.getElementById('top-products-table'),
      messageContainer: document.getElementById('message-container'),
      filterMonth: document.getElementById('month-filter'),
      filterYear: document.getElementById('year-filter'),
      filterCategory: document.getElementById('category-filter'),
      applyFilters: document.getElementById('apply-filters'),
      exportPDF: document.getElementById('export-pdf')
    };
    
    // Initialize dashboard
    this.initialize();
  }
  
  /**
   * Initialize the dashboard
   */
  initialize() {
    // Check if user is authenticated
    authService.checkAuthRequired();
    
    // Setup UI based on authentication
    this.setupUI();
    
    // Initialize the Chart.js charts
    this.initCharts();
    
    // Set default filter values to match our data
    this.setDefaultFilters();
    
    // Load analytics data
    this.loadAnalyticsData();
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Setup UI based on authentication
   */
  setupUI() {
    const admin = authService.currentAdmin;
    
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
          authService.logout();
        });
      }
    }
  }
  
  /**
   * Initialize charts with empty data
   */
  initCharts() {
    // Monthly sales chart
    const salesCtx = document.getElementById('sales-chart').getContext('2d');
    this.salesChart = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Monthly Sales ($)',
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Empty data
          fill: false,
          borderColor: '#007bff',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
    
    // Category distribution chart
    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    this.categoryChart = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Phone', 'Tablet', 'Laptop', 'Watch', 'Accessories'],
        datasets: [{
          data: [0, 0, 0, 0, 0], // Empty data
          backgroundColor: [
            '#007bff',
            '#28a745',
            '#dc3545',
            '#ffc107',
            '#6c757d'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    this.elements.applyFilters.addEventListener('click', () => this.applyFilters());
    this.elements.exportPDF.addEventListener('click', () => this.exportPDF());
  }
  
  /**
   * Load analytics data from API
   * @param {Object} filters - Optional filters
   */
  loadAnalyticsData(filters = {}) {
    // Show loading state
    this.elements.totalRevenue.textContent = 'Loading...';
    this.elements.totalOrders.textContent = 'Loading...';
    this.elements.avgOrder.textContent = 'Loading...';
    this.elements.conversionRate.textContent = 'Loading...';
    
    // Clear any existing messages
    if (this.elements.messageContainer) {
      this.elements.messageContainer.innerHTML = '';
    }
    
    // Show loading message
    this.showMessage('Loading analytics data...', true);
    
    // Get the date range from filters for logging
    const dateRange = analyticsService.calculateDateRange(filters);
    console.log(`Loading data for date range: ${dateRange.startDate} to ${dateRange.endDate}`);
    
    // Generate sales report
    analyticsService.generateSalesReport(filters)
      .then(report => {
        this.currentReport = report;
        this.updateDashboard(report);
        this.showMessage('Sales data loaded successfully!', true);
      })
      .catch(error => {
        console.error('Failed to load analytics data:', error);
        this.showMessage('Failed to load analytics data: ' + error, false);
      });
  }
  
  /**
   * Update dashboard with report data
   * @param {Object} report - Report data
   */
  updateDashboard(report) {
    try {
      if (!report) {
        console.error('Invalid report data');
        this.showMessage('Error: Invalid report data received', false);
        return;
      }
      
      // Update summary stats
      const summary = report.summary || {};
      
      // If summary is false or null, show zeros
      if (!summary || summary === false) {
        this.elements.totalRevenue.textContent = '$0';
        this.elements.totalOrders.textContent = '0';
        this.elements.avgOrder.textContent = '$0';
        this.elements.conversionRate.textContent = '0%';
        
        // Show message to user
        this.showMessage('No sales data available for the selected period', false);
      } else {
        this.elements.totalRevenue.textContent = '$' + 
          (parseFloat(summary.total_sales || 0)).toLocaleString();
        
        this.elements.totalOrders.textContent = 
          (parseInt(summary.total_orders || 0)).toLocaleString();
        
        // Calculate average order value if available
        let avgOrder = summary.average_order_value || 0;
        if (!avgOrder && summary.total_orders > 0) {
          avgOrder = summary.total_sales / summary.total_orders;
        }
        
        this.elements.avgOrder.textContent = '$' + 
          (parseFloat(avgOrder)).toLocaleString(undefined, {maximumFractionDigits: 2});
        
        // Placeholder for conversion rate (would normally come from actual data)
        this.elements.conversionRate.textContent = '3.2%';
      }
      
      // Update charts
      this.updateCharts(report);
      
      // Update top products table
      this.updateTopProductsTable(report.product_sales || []);
      
    } catch (error) {
      console.error('Error updating dashboard:', error);
      this.showMessage('Error updating dashboard: ' + error.message, false);
    }
  }
  
  /**
   * Update charts with report data
   * @param {Object} report - Report data
   */
  updateCharts(report) {
    try {
      if (!report) {
        console.error('No report data provided to updateCharts');
        return;
      }
      
      // Update monthly sales chart
      if (this.salesChart) {
        // Get monthly sales data from report
        const monthlySales = analyticsService.processMonthlyData(report.sales_by_date);
        
        // Update chart data
        this.salesChart.data.datasets[0].data = monthlySales;
        this.salesChart.update();
      }
      
      // Update category distribution chart
      if (this.categoryChart && report.category_sales) {
        console.log('Category sales data:', report.category_sales);
        
        // Extract category data
        const categories = [];
        const values = [];
        
        // Handle empty or null category_sales
        if (report.category_sales && report.category_sales.length > 0) {
          report.category_sales.forEach(cat => {
            if (cat && cat.category && cat.total_revenue) {
              categories.push(this.capitalizeFirstLetter(cat.category));
              values.push(parseFloat(cat.total_revenue));
            }
          });
        } else {
          // Default categories if no data
          categories.push('No Data');
          values.push(100);
        }
        
        // Update chart data
        this.categoryChart.data.labels = categories;
        this.categoryChart.data.datasets[0].data = values;
        this.categoryChart.update();
      }
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }
  
  /**
   * Update top products table
   * @param {Array} products - Products data
   */
  updateTopProductsTable(products) {
    try {
      const topProductsTable = this.elements.topProductsTable;
      if (!topProductsTable) {
        console.error('Top products table element not found');
        return;
      }
      
      // Clear current content
      topProductsTable.innerHTML = '';
      
      // If no products, show message
      if (!products || products.length === 0) {
        topProductsTable.innerHTML = '<tr><td colspan="4" class="text-center">No product data available</td></tr>';
        return;
      }
      
      console.log('Products data:', products);
      
      // Sort products by revenue (descending)
      const sortedProducts = [...products].sort((a, b) => {
        const revenueA = parseFloat(a.total_revenue || 0);
        const revenueB = parseFloat(b.total_revenue || 0);
        return revenueB - revenueA;
      });
      
      // Take only top 5 products
      const topProducts = sortedProducts.slice(0, 5);
      
      // Add each product to the table
      topProducts.forEach(product => {
        try {
          // Ensure all values exist
          const name = product.name || 'Unknown Product';
          const category = product.category || 'other';
          const units = parseInt(product.total_quantity || 0);
          const revenue = parseFloat(product.total_revenue || 0);
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${name}</td>
            <td><span class="category-pill pill-${category.toLowerCase()}">${this.capitalizeFirstLetter(category)}</span></td>
            <td>${units}</td>
            <td>$${revenue.toLocaleString()}</td>
          `;
          topProductsTable.appendChild(row);
        } catch (productError) {
          console.error('Error processing product:', productError, product);
        }
      });
    } catch (error) {
      console.error('Error updating top products table:', error);
    }
  }
  
  /**
   * Apply filters
   */
  applyFilters() {
    const month = this.elements.filterMonth.value;
    const year = this.elements.filterYear.value;
    const category = this.elements.filterCategory.value;
    
    // Load data with filters
    this.loadAnalyticsData({
      month: month,
      year: year,
      category: category
    });
  }
  
  /**
   * Export report as PDF
   */
  exportPDF() {
    if (this.currentReport) {
      // Show loading state
      const exportBtn = this.elements.exportPDF;
      const originalText = exportBtn.textContent;
      exportBtn.textContent = 'Generating PDF...';
      exportBtn.disabled = true;
      
      // Export report as PDF
      this.currentReport.exportPDF()
        .then(() => {
          // Show success message
          this.showMessage('Report exported successfully', true);
        })
        .catch(error => {
          console.error('Failed to export PDF:', error);
          this.showMessage('Failed to export PDF: ' + error, false);
        })
        .finally(() => {
          // Reset button state
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
        });
    } else {
      this.showMessage('No report data available to export', false);
    }
  }
  
  /**
   * Show message
   * @param {string} message - Message to show
   * @param {boolean} isSuccess - Whether message is success or error
   */
  showMessage(message, isSuccess) {
    const messageContainer = this.elements.messageContainer;
    if (!messageContainer) return;
    
    messageContainer.innerHTML = '';
    
    const messageElement = document.createElement('div');
    messageElement.className = isSuccess ? 'alert alert-success' : 'alert alert-danger';
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }
  
  /**
   * Set default filter values
   */
  setDefaultFilters() {
    // Set year to 2024
    const yearFilter = this.elements.filterYear;
    if (yearFilter) {
      const defaultYear = "2024";
      
      // Find and select the 2024 option
      for (let i = 0; i < yearFilter.options.length; i++) {
        if (yearFilter.options[i].value === defaultYear) {
          yearFilter.selectedIndex = i;
          break;
        }
      }
      
      // If 2024 option doesn't exist, add it
      if (!Array.from(yearFilter.options).some(option => option.value === defaultYear)) {
        const option = document.createElement('option');
        option.value = defaultYear;
        option.textContent = defaultYear;
        yearFilter.appendChild(option);
        yearFilter.value = defaultYear;
      }
    }
    
    // Set month to 'all' by default
    const monthFilter = this.elements.filterMonth;
    if (monthFilter) {
      monthFilter.value = 'all';
    }
    
    // Set category to 'all' by default
    const categoryFilter = this.elements.filterCategory;
    if (categoryFilter) {
      categoryFilter.value = 'all';
    }
  }
  
  /**
   * Helper function to capitalize first letter
   * @param {string} string - String to capitalize
   * @returns {string} Capitalized string
   */
  capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// Initialize dashboard when window loads
window.onload = function() {
  // Create dashboard manager
  const dashboard = new DashboardManager();
}; 