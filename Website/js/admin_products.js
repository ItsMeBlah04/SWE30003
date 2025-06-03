// Initialize services
const productService = new ProductService();
const authService = new AuthService();

// DOM Elements
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const addProductBtn = document.getElementById('add-product-btn');
const cancelBtn = document.getElementById('cancel-btn');
const formTitle = document.getElementById('form-title');
const saveBtn = document.getElementById('save-btn');
const deleteModal = document.getElementById('delete-modal');
const closeModal = document.getElementById('close-modal');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');
const messageContainer = document.getElementById('message-container');

// State
let products = [];
let currentProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is authenticated
  authService.checkAuthRequired();
  
  // Setup UI based on authentication
  setupUI();
  
  // Load products
  loadProducts();
  
  // Setup event listeners
  setupEventListeners();
});

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

// Load products from the database
function loadProducts() {
  // Show loading indicator
  productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading products...</td></tr>';
  
  productService.getAllProducts()
    .then(loadedProducts => {
      products = loadedProducts;
      displayProducts();
    })
    .catch(error => {
      console.error('Failed to load products:', error);
      showMessage('Failed to load products: ' + error, false);
      productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load products</td></tr>';
    });
}

// Setup event listeners
function setupEventListeners() {
  addProductBtn.addEventListener('click', showAddProductForm);
  cancelBtn.addEventListener('click', hideProductForm);
  
  // Fix form submission handling
  const productFormElement = document.getElementById('productForm');
  productFormElement.addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent form submission
    saveProduct(e);
  });
  
  closeModal.addEventListener('click', hideDeleteModal);
  cancelDelete.addEventListener('click', hideDeleteModal);
  confirmDelete.addEventListener('click', deleteConfirmed);
  
  // Image preview - always use default.png
  document.getElementById('product-image').addEventListener('input', function(e) {
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = '';
    
    // Always show default.png
    const img = document.createElement('img');
    img.src = '../images/default.png';
    img.className = 'image-preview';
    previewContainer.appendChild(img);
  });
}

// Display all products in table
function displayProducts() {
  productList.innerHTML = '';
  
  if (products.length === 0) {
    productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>';
    return;
  }
  
  products.forEach(product => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${product.id}</td>
      <td><img src="../images/default.png" alt="${product.name}" width="50" height="50"></td>
      <td>${product.name}</td>
      <td>${capitalizeFirstLetter(product.category || '')}</td>
      <td>$${parseFloat(product.price).toFixed(2)}</td>
      <td>${product.stock}</td>
      <td class="btn-group">
        <button class="btn-action btn-edit" data-id="${product.id}">Edit</button>
        <button class="btn-action btn-delete" data-id="${product.id}">Delete</button>
      </td>
    `;
    
    productList.appendChild(row);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      editProduct(id);
    });
  });
  
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', function() {
      const id = parseInt(this.getAttribute('data-id'));
      showDeleteModal(id);
    });
  });
}

// Show form to add a new product
function showAddProductForm() {
  formTitle.textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('image-preview-container').innerHTML = '';
  currentProductId = null;
  productForm.style.display = 'block';
  saveBtn.textContent = 'Add Product';
}

// Hide product form
function hideProductForm() {
  productForm.style.display = 'none';
}

// Edit an existing product
function editProduct(id) {
  // Show loading in form
  formTitle.textContent = 'Loading...';
  productForm.style.display = 'block';
  
  productService.getProductById(id)
    .then(product => {
      formTitle.textContent = 'Edit Product';
      currentProductId = product.id;
      
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-category').value = product.category || '';
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-stock').value = product.stock;
      document.getElementById('product-image').value = product.image || '';
      document.getElementById('product-description').value = product.description;
      
      // Show image preview
      const previewContainer = document.getElementById('image-preview-container');
      previewContainer.innerHTML = '';
      
      // Always use default.png for preview
      const img = document.createElement('img');
      img.src = '../images/default.png';
      img.className = 'image-preview';
      previewContainer.appendChild(img);
      
      saveBtn.textContent = 'Save Changes';
    })
    .catch(error => {
      hideProductForm();
      showMessage(error, false);
    });
}

// Save product (add new or update existing)
function saveProduct(e) {
  if (e) {
    e.preventDefault();
  }
  
  // Create product instance from form data
  const productData = {
    id: currentProductId,
    name: document.getElementById('product-name').value,
    category: document.getElementById('product-category').value,
    price: parseFloat(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value),
    image: document.getElementById('product-image').value,
    description: document.getElementById('product-description').value
  };
  
  const product = new Product(productData);
  
  // Disable the save button while processing
  saveBtn.disabled = true;
  saveBtn.textContent = currentProductId ? 'Saving...' : 'Adding...';
  
  // Save product
  productService.saveProduct(product)
    .then(savedProduct => {
      hideProductForm();
      showMessage(currentProductId ? 'Product updated successfully' : 'Product created successfully', true);
      
      // Reload products from the server to ensure data consistency
      loadProducts();
    })
    .catch(error => {
      saveBtn.disabled = false;
      saveBtn.textContent = currentProductId ? 'Save Changes' : 'Add Product';
      showMessage(error, false);
    });
}

// Show delete confirmation modal
function showDeleteModal(id) {
  currentProductId = id;
  deleteModal.style.display = 'flex';
}

// Hide delete confirmation modal
function hideDeleteModal() {
  deleteModal.style.display = 'none';
  currentProductId = null;
}

// Delete product after confirmation
function deleteConfirmed() {
  if (currentProductId) {
    // Show loading state
    confirmDelete.textContent = 'Deleting...';
    confirmDelete.disabled = true;
    
    productService.deleteProduct(currentProductId)
      .then(() => {
        hideDeleteModal();
        showMessage('Product deleted successfully', true);
        
        // Reload products
        loadProducts();
      })
      .catch(error => {
        hideDeleteModal();
        showMessage(error, false);
      })
      .finally(() => {
        confirmDelete.textContent = 'Delete';
        confirmDelete.disabled = false;
      });
  }
}

// Show message to user
function showMessage(message, isSuccess) {
  messageContainer.innerHTML = `<div class="${isSuccess ? 'success' : 'error'}">${message}</div>`;
  setTimeout(() => {
    messageContainer.innerHTML = '';
  }, isSuccess ? 3000 : 5000);
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} 