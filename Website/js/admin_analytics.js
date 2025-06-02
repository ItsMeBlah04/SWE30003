// Initialize with window.onload to ensure all assets are loaded
window.onload = function() {
  // Initialize the Chart.js charts
  initCharts();
  
  // Load data from API
  loadAnalyticsData();
  
  // Set up event listeners
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
};

// Store current analytics data
let currentData = null;

// Chart objects
let salesChart;
let categoryChart;

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
  
  // Prepare URL with query parameters
  // Use the PHP endpoint in XAMPP
  let url = 'http://localhost:5000/admin_analytics';
  const params = new URLSearchParams();
  
  if (filters.month) params.append('month', filters.month);
  if (filters.year) params.append('year', filters.year);
  if (filters.category) params.append('category', filters.category);
  
  if (params.toString()) {
    url += '?' + params.toString();
  }
  
  console.log('Fetching analytics data from:', url);
  
  // Fetch data from API
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Received data:', data);
      if (data.success) {
        currentData = data;
        updateDashboard(data);
      } else {
        console.error('API Error:', data.message);
        // Show fallback data if API fails
        loadSampleData();
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      // Show fallback data if fetch fails
      loadSampleData();
    });
}

// Update dashboard with data
function updateDashboard(data) {
  // Update stats
  document.getElementById('total-revenue').textContent = '$' + data.stats.totalRevenue.toLocaleString();
  document.getElementById('total-orders').textContent = data.stats.totalOrders.toLocaleString();
  document.getElementById('avg-order').textContent = '$' + data.stats.averageOrder.toLocaleString();
  document.getElementById('conversion-rate').textContent = data.stats.conversionRate + '%';
  
  // Update charts
  updateCharts(data);
  
  // Update top products
  updateTopProductsTable(data.topProducts);
}

// Update charts with new data
function updateCharts(data) {
  // Update monthly sales chart
  salesChart.data.datasets[0].data = data.monthlySales;
  salesChart.update();
  
  // Update category chart
  categoryChart.data.datasets[0].data = [
    data.categoryData.phone,
    data.categoryData.tablet,
    data.categoryData.laptop,
    data.categoryData.watch,
    data.categoryData.accessories
  ];
  categoryChart.update();
}

// Update top products table
function updateTopProductsTable(products) {
  const topProductsTable = document.getElementById('top-products');
  topProductsTable.innerHTML = '';
  
  products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.name}</td>
      <td><span class="category-pill pill-${product.category}">${capitalizeFirstLetter(product.category)}</span></td>
      <td>${product.units}</td>
      <td>$${product.revenue.toLocaleString()}</td>
    `;
    topProductsTable.appendChild(row);
  });
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

// Sample data for fallback if API fails
const sampleData = {
  stats: {
    totalRevenue: 297300,
    totalOrders: 534,
    averageOrder: 557,
    conversionRate: 3.2
  },
  monthlySales: [15200, 17800, 16500, 20100, 22400, 24800, 26200, 28900, 27500, 30100, 32800, 35000],
  categoryData: {
    phone: 42,
    tablet: 18,
    laptop: 25,
    watch: 8,
    accessories: 7
  },
  topProducts: [
    { name: "iPhone 16", category: "phone", units: 245, revenue: 244755 },
    { name: "MacBook", category: "laptop", units: 130, revenue: 155870 },
    { name: "iPad Pro", category: "tablet", units: 118, revenue: 129682 },
    { name: "Apple Watch Ultra", category: "watch", units: 95, revenue: 75905 },
    { name: "Apple Watch", category: "watch", units: 210, revenue: 52290 }
  ]
};

// Load sample data as fallback
function loadSampleData() {
  updateDashboard(sampleData);
}

// Export as PDF
function exportPDF() {
  const { jsPDF } = window.jspdf;
  const reportContainer = document.getElementById('report-container');
  
  // First, we need to prepare the document for PDF export
  // This adds a class that makes some visual adjustments for printing
  document.body.classList.add('exporting');
  
  // Create PDF with custom dimensions
  const pdf = new jsPDF('portrait', 'pt', 'a4');
  
  // Use html2canvas to capture the report container
  html2canvas(reportContainer, {
    scale: 2, // Higher scale for better quality
    useCORS: true, // To handle external images
    logging: false
  }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 550;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 30, 30, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save('electrik_sales_report.pdf');
    
    // Remove the printing class
    document.body.classList.remove('exporting');
  });
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} 