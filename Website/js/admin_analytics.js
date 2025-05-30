// Initialize with window.onload to ensure all assets are loaded
window.onload = function() {
  // Initialize the Chart.js charts
  initCharts();
  
  // Load sample data
  loadSampleData();
  
  // Set up event listeners
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('export-pdf').addEventListener('click', exportPDF);
};

// Sample data for charts and tables
const sampleData = {
  monthlySales: [15200, 17800, 16500, 20100, 22400, 24800, 26200, 28900, 27500, 30100, 32800, 35000],
  categoryData: {
    phones: 42,
    tablets: 18,
    laptops: 25,
    watches: 8,
    accessories: 7
  },
  topProducts: [
    { name: 'iPhone 16 Pro', category: 'phone', units: 245, revenue: 244755 },
    { name: 'MacBook Air M2', category: 'laptop', units: 130, revenue: 155870 },
    { name: 'iPad Pro 12.9', category: 'tablet', units: 118, revenue: 129682 },
    { name: 'Apple Watch Ultra', category: 'watch', units: 95, revenue: 75905 },
    { name: 'AirPods Pro', category: 'accessories', units: 210, revenue: 52290 }
  ]
};

// Chart objects
let salesChart;
let categoryChart;

// Initialize charts
function initCharts() {
  // Monthly sales chart
  const salesCtx = document.getElementById('sales-chart').getContext('2d');
  salesChart = new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Monthly Sales ($)',
        data: sampleData.monthlySales,
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
        data: [
          sampleData.categoryData.phones,
          sampleData.categoryData.tablets,
          sampleData.categoryData.laptops,
          sampleData.categoryData.watches,
          sampleData.categoryData.accessories
        ],
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

// Load sample data to the page
function loadSampleData() {
  // Update total stats
  document.getElementById('total-revenue').textContent = '$' + calculateTotalRevenue().toLocaleString();
  document.getElementById('total-orders').textContent = calculateTotalOrders().toLocaleString();
  document.getElementById('avg-order').textContent = '$' + calculateAverageOrder().toLocaleString();
  document.getElementById('conversion-rate').textContent = '3.2%';
  
  // Populate top products table
  const topProductsTable = document.getElementById('top-products');
  topProductsTable.innerHTML = '';
  
  sampleData.topProducts.forEach(product => {
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

// Apply filters to data
function applyFilters() {
  const month = document.getElementById('month-filter').value;
  const year = document.getElementById('year-filter').value;
  const category = document.getElementById('category-filter').value;
  
  // This would normally make an API call to get filtered data
  // For demo purposes, we'll just show a message and keep the same data
  alert(`Filters applied: Month: ${month}, Year: ${year}, Category: ${category}`);
  
  // For demonstration, let's modify the charts slightly when filters are applied
  // In a real application, this would use real filtered data
  if (month !== 'all') {
    // If specific month is selected, highlight that month in chart
    const monthIndex = parseInt(month) - 1;
    const newData = [...sampleData.monthlySales].map((val, i) => 
      i === monthIndex ? val * 1.2 : val * 0.7
    );
    
    salesChart.data.datasets[0].data = newData;
    salesChart.update();
    
    // Also update total stats based on "filtered" data
    document.getElementById('total-revenue').textContent = '$' + (calculateTotalRevenue() * 0.8).toLocaleString();
    document.getElementById('total-orders').textContent = Math.round(calculateTotalOrders() * 0.8).toLocaleString();
  } else {
    // Reset to original data
    salesChart.data.datasets[0].data = sampleData.monthlySales;
    salesChart.update();
    
    document.getElementById('total-revenue').textContent = '$' + calculateTotalRevenue().toLocaleString();
    document.getElementById('total-orders').textContent = calculateTotalOrders().toLocaleString();
  }
  
  if (category !== 'all') {
    // Modify category chart to emphasize selected category
    const categoryIndex = getCategoryIndex(category);
    const newData = [
      sampleData.categoryData.phones * (category === 'phone' ? 1.5 : 0.7),
      sampleData.categoryData.tablets * (category === 'tablet' ? 1.5 : 0.7),
      sampleData.categoryData.laptops * (category === 'laptop' ? 1.5 : 0.7),
      sampleData.categoryData.watches * (category === 'watch' ? 1.5 : 0.7),
      sampleData.categoryData.accessories * (category === 'accessories' ? 1.5 : 0.7)
    ];
    
    categoryChart.data.datasets[0].data = newData;
    categoryChart.update();
    
    // Filter top products
    const filteredProducts = sampleData.topProducts.filter(p => p.category === category);
    updateTopProductsTable(filteredProducts);
  } else {
    // Reset to original data
    categoryChart.data.datasets[0].data = [
      sampleData.categoryData.phones,
      sampleData.categoryData.tablets,
      sampleData.categoryData.laptops,
      sampleData.categoryData.watches,
      sampleData.categoryData.accessories
    ];
    categoryChart.update();
    
    // Reset top products
    updateTopProductsTable(sampleData.topProducts);
  }
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

// Helper functions
function calculateTotalRevenue() {
  return sampleData.monthlySales.reduce((a, b) => a + b, 0);
}

function calculateTotalOrders() {
  return 534; // Sample fixed value for demo
}

function calculateAverageOrder() {
  return Math.round(calculateTotalRevenue() / calculateTotalOrders());
}

function getCategoryIndex(category) {
  const categories = ['phone', 'tablet', 'laptop', 'watch', 'accessories'];
  return categories.indexOf(category);
}

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

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} 