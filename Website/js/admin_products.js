// API endpoints
const API_URL = 'http://localhost:5000/admin_update_product';

// Sample product data as fallback (will be replaced with data from the API)
let products = [];

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

let currentProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();
  setupEventListeners();
});

// Load products from the database
function loadProducts() {
  // Show loading indicator
  productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Loading products...</td></tr>';
  
  const formData = new FormData();
  formData.append('action', 'get_all');
  
  fetch(API_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      products = data.products;
      displayProducts();
    } else {
      showMessage(data.message || 'Error loading products', false);
      productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load products</td></tr>';
    }
  })
  .catch(error => {
    console.error('Failed to load products:', error);
    showMessage('Network error: ' + error, false);
    productList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Failed to load products</td></tr>';
  });
}

// Setup event listeners
function setupEventListeners() {
  addProductBtn.addEventListener('click', showAddProductForm);
  cancelBtn.addEventListener('click', hideProductForm);
  document.getElementById('productForm').addEventListener('submit', saveProduct);
  closeModal.addEventListener('click', hideDeleteModal);
  cancelDelete.addEventListener('click', hideDeleteModal);
  confirmDelete.addEventListener('click', deleteConfirmed);
  
  // Image preview
  document.getElementById('product-image').addEventListener('input', function(e) {
    const imageUrl = e.target.value;
    const previewContainer = document.getElementById('image-preview-container');
    previewContainer.innerHTML = '';
    
    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.className = 'image-preview';
      img.onerror = () => {
        previewContainer.innerHTML = '<p style="color: red;">Invalid image URL</p>';
      };
      previewContainer.appendChild(img);
    }
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
      <td><img src="${product.image}" alt="${product.name}" width="50" height="50" onerror="this.src='../images/placeholder.jpg'"></td>
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
  
  const formData = new FormData();
  formData.append('action', 'get_product');
  formData.append('id', id);
  
  fetch(API_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const product = data.product;
      formTitle.textContent = 'Edit Product';
      currentProductId = product.id;
      
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-category').value = product.category || '';
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-stock').value = product.stock;
      document.getElementById('product-image').value = product.image;
      document.getElementById('product-description').value = product.description;
      
      // Show image preview
      const previewContainer = document.getElementById('image-preview-container');
      previewContainer.innerHTML = '';
      if (product.image) {
        const img = document.createElement('img');
        img.src = product.image;
        img.className = 'image-preview';
        previewContainer.appendChild(img);
      }
      
      saveBtn.textContent = 'Save Changes';
    } else {
      hideProductForm();
      showMessage(data.message || 'Error retrieving product', false);
    }
  })
  .catch(error => {
    hideProductForm();
    showMessage('Network error: ' + error, false);
  });
}

// Save product (add new or update existing)
function saveProduct(e) {
  e.preventDefault();
  
  const productData = {
    name: document.getElementById('product-name').value,
    category: document.getElementById('product-category').value,
    price: parseFloat(document.getElementById('product-price').value),
    stock: parseInt(document.getElementById('product-stock').value),
    image: document.getElementById('product-image').value,
    description: document.getElementById('product-description').value
  };
  
  const isUpdate = currentProductId !== null;
  
  if (isUpdate) {
    productData.id = currentProductId;
  }
  
  // Disable the save button while processing
  saveBtn.disabled = true;
  saveBtn.textContent = isUpdate ? 'Saving...' : 'Adding...';
  
  const formData = new FormData();
  formData.append('action', isUpdate ? 'update' : 'create');
  
  // Add all product fields to the form data
  for (const key in productData) {
    formData.append(key, productData[key]);
  }
  
  fetch(API_URL, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // For new products, add the new ID to the product object
      if (!isUpdate && data.id) {
        productData.id = data.id;
      }
      
      hideProductForm();
      showMessage(isUpdate ? 'Product updated successfully' : 'Product created successfully', true);
      
      // Reload products from the server to ensure data consistency
      loadProducts();
    } else {
      saveBtn.disabled = false;
      saveBtn.textContent = isUpdate ? 'Save Changes' : 'Add Product';
      showMessage(data.message || 'Error saving product', false);
    }
  })
  .catch(error => {
    saveBtn.disabled = false;
    saveBtn.textContent = isUpdate ? 'Save Changes' : 'Add Product';
    showMessage('Network error: ' + error, false);
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

// Delete product when confirmed
function deleteConfirmed() {
  if (currentProductId) {
    // Disable delete button while processing
    confirmDelete.disabled = true;
    confirmDelete.textContent = 'Deleting...';
    
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', currentProductId);
    
    fetch(API_URL, {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      hideDeleteModal();
      
      if (data.success) {
        showMessage('Product deleted successfully', true);
        // Reload products from the server
        loadProducts();
      } else {
        showMessage(data.message || 'Error deleting product', false);
      }
    })
    .catch(error => {
      hideDeleteModal();
      showMessage('Network error: ' + error, false);
    });
  }
}

// Display messages
function showMessage(message, isSuccess) {
  const messageClass = isSuccess ? 'success' : 'error';
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="message ${messageClass}">${message}</div>`;
    setTimeout(function() {
      messageContainer.innerHTML = '';
    }, 5000);
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} 