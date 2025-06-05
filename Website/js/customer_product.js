// Product class
class Product {
  constructor(data) {
    this.id = data.product_id || data.id; // handle product_id fallback
    this.name = data.name;
    this.description = data.description;
    this.price = parseFloat(data.price);
    this.stock = data.stock;
    this.category = data.category;
  }
}

// DOM Elements
const productList = document.getElementById('product-list');
const cartCount = document.getElementById('cart-count');
const searchInput = document.getElementById('search-input');
let cart = JSON.parse(localStorage.getItem('guestCartItems')) || [];
let allProducts = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartDisplay();

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
});

// Load products from PHP backend
function loadProducts() {
  productList.innerHTML = '<div class="loading">Loading products...</div>';

  const formData = new FormData();
  formData.append('action', 'get_all');

  fetch('../php/productHandle.php', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.success && Array.isArray(data.products)) {
        allProducts = data.products.map(p => new Product(p));
        displayProducts(allProducts);
      } else {
        productList.innerHTML = '<div class="empty">No products found</div>';
      }
    })
    .catch(error => {
      console.error('Failed to load products:', error);
      productList.innerHTML = `<div class="error">Failed to load products: ${error}</div>`;
    });
}

// Display product cards
function displayProducts(products) {
  productList.innerHTML = '';

  if (products.length === 0) {
    productList.innerHTML = '<div class="empty">No matching products</div>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    card.innerHTML = `
      <img src="../images/default.png" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>${product.description || 'No description'}</p>
      <p class="price">$${product.price.toFixed(2)}</p>
      <button class="btn" data-id="${product.id}">Add to Cart</button>
    `;

    card.querySelector('button').addEventListener('click', () => {
      addToCart(product);
    });

    productList.appendChild(card);
  });
}

// Search handler
function handleSearch() {
  const query = searchInput.value.toLowerCase();
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(query)
  );
  displayProducts(filtered);
}

// Add to cart logic
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    // Deep clone to avoid reference issues
    const productClone = JSON.parse(JSON.stringify({ ...product, quantity: 1 }));
    cart.push(productClone);
  }

  localStorage.setItem('guestCartItems', JSON.stringify(cart));
  updateCartDisplay();
}

// Update cart count in nav
function updateCartDisplay() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalItems;
}
