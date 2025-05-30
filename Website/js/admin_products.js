// Sample product data
let products = [
  {
    id: 1,
    name: "iPhone 16 Pro",
    category: "phone",
    price: 999.00,
    stock: 45,
    image: "../images/iphone.jpg",
    description: "Apple's latest flagship phone with advanced camera system."
  },
  {
    id: 2,
    name: "Apple Watch 10",
    category: "watch",
    price: 399.00,
    stock: 30,
    image: "../images/apple watch.jpg",
    description: "Thin and light Apple Watch for indoor and outdoor activities."
  },
  {
    id: 3,
    name: "iPad Pro 11",
    category: "tablet",
    price: 799.00,
    stock: 25,
    image: "../images/ipad.jpg",
    description: "Professional-grade tablet with M2 chip."
  },
  {
    id: 4,
    name: "MacBook Air M2",
    category: "laptop",
    price: 1299.00,
    stock: 20,
    image: "../images/macbook.jpg",
    description: "Thin and light laptop with all-day battery life."
  },
  {
    id: 5,
    name: "Apple Watch Ultra",
    category: "watch",
    price: 1399.00,
    stock: 15,
    image: "../images/apple watch ultra.jpg",
    description: "Rugged and capable Apple Watch for outdoor adventures."
  }
];

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

let currentProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  displayProducts();
  setupEventListeners();
});

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
  
  products.forEach(product => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${product.id}</td>
      <td><img src="${product.image}" alt="${product.name}" width="50" height="50" onerror="this.src='../images/placeholder.jpg'"></td>
      <td>${product.name}</td>
      <td>${capitalizeFirstLetter(product.category)}</td>
      <td>$${product.price.toFixed(2)}</td>
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
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  formTitle.textContent = 'Edit Product';
  currentProductId = id;
  
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-category').value = product.category;
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
  
  productForm.style.display = 'block';
  saveBtn.textContent = 'Save Changes';
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
  
  if (currentProductId) {
    // Update existing product
    const index = products.findIndex(p => p.id === currentProductId);
    if (index !== -1) {
      products[index] = { ...products[index], ...productData };
    }
  } else {
    // Add new product
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    products.push({
      id: newId,
      ...productData
    });
  }
  
  hideProductForm();
  displayProducts();
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
    products = products.filter(p => p.id !== currentProductId);
    displayProducts();
    hideDeleteModal();
  }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
} 