// Initialize services
const analyticsService = new AnalyticsService();
const authService = new AuthService();

// Chart objects
let salesChart;
let categoryChart;

// Current report data
let currentReport = null;

// Initialize with window.onload to ensure all assets are loaded
window.onload = function() {
  // Check if user is authenticated
  authService.checkAuthRequired();
  
  // Setup UI based on authentication
  setupUI();
  
  // Initialize the Chart.js charts
  initCharts();
  
  // Set default filter values to match our data
  setDefaultFilters();
  
  // Load analytics data
  loadAnalyticsData();
  
  // Set up event listeners
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
};

// Setup UI based on authentication
function setupUI() {
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
      logoutBtn.addEventListener('click', function() {
        authService.logout();
      });
    }
  }
}

// Initialize charts with empty data
function initCharts() {
  // Monthly sales chart
  const salesCtx = document.getElementById('sales-chart').getContext('2d');
  salesChart = new Chart(salesCtx, {
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
  categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: ['Phones', 'Tablets', 'Laptops', 'Watches', 'Accessories'],
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

// Load analytics data from API
function loadAnalyticsData(filters = {}) {
  // Show loading state
  document.getElementById('total-revenue').textContent = 'Loading...';
  document.getElementById('total-orders').textContent = 'Loading...';
  document.getElementById('avg-order').textContent = 'Loading...';
  document.getElementById('conversion-rate').textContent = 'Loading...';
  
  // Clear any existing messages
  const messageContainer = document.getElementById('message-container');
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }
  
  // Show loading message
  showMessage('Loading analytics data...', true);
  
  // Get the date range from filters for logging
  const dateRange = getDateRangeFromFilters(filters);
  console.log(`Loading data for date range: ${dateRange.startDate} to ${dateRange.endDate}`);
  
  // Generate sales report
  analyticsService.generateSalesReport(filters)
    .then(report => {
      currentReport = report;
      
      // Check if we got actual data or sample data
      if (report.is_sample_data) {
        showMessage('Note: Showing sample data as no real data was found for the selected date range', false);
      } else if (report.stats.totalOrders === 0) {
        showMessage('No sales data found for the selected date range. Try a different date range.', false);
      } else {
        showMessage('Sales data loaded successfully!', true);
      }
      
      updateDashboard(report);
    })
    .catch(error => {
      console.error('Failed to load analytics data:', error);
      // Show error message
      showMessage('Failed to load analytics data: ' + error, false);
      
      // Try to load with default filters
      const defaultFilters = {
        month: 'all',
        year: '2025'
      };
      
      console.log('Trying with default filters:', defaultFilters);
      analyticsService.generateSalesReport(defaultFilters)
        .then(report => {
          currentReport = report;
          updateDashboard(report);
          showMessage('Showing data for 2025 instead', false);
        })
        .catch(fallbackError => {
          console.error('Failed to load with default filters:', fallbackError);
        });
    });
}

// Helper function to get date range from filters
function getDateRangeFromFilters(filters) {
  return analyticsService.calculateDateRange(filters);
}

// Update dashboard with report data
function updateDashboard(report) {
  try {
    if (!report || !report.stats) {
      console.error('Invalid report data:', report);
      showMessage('Error: Invalid report data received', false);
      return;
    }
    
    // Update stats - safely
    try {
      document.getElementById('total-revenue').textContent = '$' + 
        (typeof report.stats.totalRevenue === 'number' ? report.stats.totalRevenue.toLocaleString() : '0');
      
      document.getElementById('total-orders').textContent = 
        (typeof report.stats.totalOrders === 'number' ? report.stats.totalOrders.toLocaleString() : '0');
      
      document.getElementById('avg-order').textContent = '$' + 
        (typeof report.stats.averageOrder === 'number' ? report.stats.averageOrder.toLocaleString() : '0');
      
      document.getElementById('conversion-rate').textContent = 
        (typeof report.stats.conversionRate === 'number' ? report.stats.conversionRate : '0') + '%';
    } catch (statsError) {
      console.error('Error updating stats:', statsError);
    }
    
    // Update charts - safely
    try {
      updateCharts(report);
    } catch (chartError) {
      console.error('Error in chart update:', chartError);
    }
    
    // Update top products - safely
    try {
      updateTopProductsTable(report.topProducts);
    } catch (tableError) {
      console.error('Error updating product table:', tableError);
    }
    
    // Show sample data notice if using sample data
    if (report.is_sample_data) {
      showMessage('Note: Displaying sample data as real data could not be loaded', false);
    }
  } catch (error) {
    console.error('Error updating dashboard:', error);
    showMessage('Failed to update dashboard with report data', false);
  }
}

// Update charts with new data
function updateCharts(report) {
  try {
    // Safety check - ensure charts are initialized
    if (!salesChart || !categoryChart) {
      console.error('Charts not initialized');
      return;
    }
    
    // Update monthly sales chart - safely
    if (salesChart.data && salesChart.data.datasets && salesChart.data.datasets[0]) {
      salesChart.data.datasets[0].data = report.monthlySales || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      // Use requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        salesChart.update('none'); // Use 'none' mode for better performance
      });
    }
    
    // Small delay between chart updates to prevent rendering conflicts
    setTimeout(() => {
      // Update category chart - safely
      if (categoryChart.data && categoryChart.data.datasets && categoryChart.data.datasets[0]) {
        const categoryValues = [
          report.categoryData.phone || 0,
          report.categoryData.tablet || 0,
          report.categoryData.laptop || 0,
          report.categoryData.watch || 0,
          report.categoryData.accessories || 0
        ];
        
        categoryChart.data.datasets[0].data = categoryValues;
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          categoryChart.update('none'); // Use 'none' mode for better performance
        });
      }
    }, 100); // 100ms delay
  } catch (error) {
    console.error('Error updating charts:', error);
    // Don't let chart errors break the entire dashboard
  }
}

// Update top products table
function updateTopProductsTable(products) {
  try {
    const topProductsTable = document.getElementById('top-products');
    if (!topProductsTable) {
      console.error('Top products table element not found');
      return;
    }
    
    // Clear current content
    topProductsTable.innerHTML = '';
    
    // Check if we have products
    if (!products || !Array.isArray(products) || products.length === 0) {
      // Add a "no data" row
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = '<td colspan="4" class="text-center">No product data available</td>';
      topProductsTable.appendChild(noDataRow);
      return;
    }
    
    // Add each product to the table
    products.forEach(product => {
      try {
        // Ensure all values exist
        const name = product.name || 'Unknown Product';
        const category = product.category || 'other';
        const units = typeof product.units === 'number' ? product.units : 0;
        const revenue = typeof product.revenue === 'number' ? product.revenue : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${name}</td>
          <td><span class="category-pill pill-${category}">${capitalizeFirstLetter(category)}</span></td>
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
    // Don't let table errors break the entire dashboard
  }
}

// Apply filters
function applyFilters() {
  const month = document.getElementById('month-filter').value;
  const year = document.getElementById('year-filter').value;
  const category = document.getElementById('category-filter').value;
  
  // Load data with filters
  loadAnalyticsData({
    month: month,
    year: year,
    category: category
  });
}

// Export as PDF
function exportPDF() {
  if (currentReport) {
    // Show loading state
    const exportBtn = document.getElementById('export-pdf');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Generating PDF...';
    exportBtn.disabled = true;
    
    // Export report as PDF
    currentReport.exportPDF()
      .then(() => {
        // Show success message
        showMessage('Report exported successfully', true);
      })
      .catch(error => {
        console.error('Failed to export PDF:', error);
        showMessage('Failed to export PDF: ' + error, false);
      })
      .finally(() => {
        // Reset button state
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
      });
  } else {
    showMessage('No report data available to export', false);
  }
}

// Show message
function showMessage(message, isSuccess) {
  const messageContainer = document.getElementById('message-container');
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

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set default filter values that match our mock data
function setDefaultFilters() {
  // Set year to 2025 where we have data
  const yearFilter = document.getElementById('year-filter');
  if (yearFilter) {
    // Find and select the 2025 option
    for (let i = 0; i < yearFilter.options.length; i++) {
      if (yearFilter.options[i].value === '2025') {
        yearFilter.selectedIndex = i;
        break;
      }
    }
    
    // If 2025 option doesn't exist, add it
    if (!Array.from(yearFilter.options).some(option => option.value === '2025')) {
      const option = document.createElement('option');
      option.value = '2025';
      option.textContent = '2025';
      yearFilter.appendChild(option);
      yearFilter.value = '2025';
    }
  }
  
  // Set month to 'all' by default
  const monthFilter = document.getElementById('month-filter');
  if (monthFilter) {
    monthFilter.value = 'all';
  }
  
  // Set category to 'all' by default
  const categoryFilter = document.getElementById('category-filter');
  if (categoryFilter) {
    categoryFilter.value = 'all';
  }
} 