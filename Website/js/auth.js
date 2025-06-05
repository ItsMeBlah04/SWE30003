// Initialize services
console.log('Initializing authentication service...');

const authService = new AuthService();

// DOM Elements
const loginForm = document.getElementById('login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const signupForm = document.getElementById('signup-form');
const userToggle = document.getElementById('user-toggle');
const adminToggle = document.getElementById('admin-toggle');
const messageContainer = document.getElementById('message-container');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Setup forms
  setupForms();
  
  // Setup toggles
  setupToggles();
  
  // Check for redirect parameter
  checkRedirect();
});

// Setup form submission
function setupForms() {
  // User login form
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const inputs = this.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const password = inputs[1].value;
    
    // Disable submit button
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // Login as customer
    loginAsCustomer(username, password, submitBtn, originalText);
  });
  
  // Admin login form
  adminLoginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const inputs = this.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const password = inputs[1].value;
    
    // Disable submit button
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    // Login as admin
    loginAsAdmin(username, password, submitBtn, originalText);
  });
  
  // Signup form
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Get form data
    const first_name = signupForm.querySelector('input[name="first_name"]').value.trim();
    const last_name = signupForm.querySelector('input[name="last_name"]').value.trim();
    const email = signupForm.querySelector('input[name="email"]').value.trim();
    const phone = signupForm.querySelector('input[name="phone"]').value.trim();
    const address = signupForm.querySelector('input[name="address"]').value.trim();
    const password = signupForm.querySelector('input[name="password"]').value;

    // Disable submit button
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

    // Register new customer
    authService.registerCustomer({
      first_name,
      last_name,
      email,
      phone,
      address, 
      password
    })
    .then(data => {
      showMessage('Account created successfully!', true);
      window.location.href = 'web.html';
    })
    .catch(error => {
      showMessage(error, false);
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  });
}

// Setup toggle functionality
function setupToggles() {
  // Toggle between login and signup forms
  const toggleLink = document.querySelector('.toggle-link');
  if (toggleLink) {
    toggleLink.addEventListener('click', toggleForms);
  }
  
  // Toggle between user and admin login
  if (userToggle && adminToggle) {
    userToggle.addEventListener('click', function() {
      toggleLoginType('user');
    });
    
    adminToggle.addEventListener('click', function() {
      toggleLoginType('admin');
    });
  }
}

// Toggle between login and signup forms
function toggleForms() {
  const title = document.getElementById('form-title');
  const toggleLink = document.querySelector('.toggle-link');
  const loginToggleDiv = document.querySelector('.login-toggle');

  if (loginForm.style.display === 'none' && adminLoginForm.style.display === 'none') {
    // Show login form
    loginForm.style.display = 'block';
    adminLoginForm.style.display = 'none';
    signupForm.style.display = 'none';
    title.textContent = 'Login';
    toggleLink.textContent = "Don't have an account? Sign Up";
    loginToggleDiv.style.display = 'flex';
    userToggle.classList.add('active');
    adminToggle.classList.remove('active');
  } else {
    // Show signup form
    loginForm.style.display = 'none';
    adminLoginForm.style.display = 'none';
    signupForm.style.display = 'block';
    title.textContent = 'Sign Up';
    toggleLink.textContent = "Already have an account? Login";
    loginToggleDiv.style.display = 'none';
  }
}

// Toggle between user and admin login forms
function toggleLoginType(type) {
  if (type === 'user') {
    loginForm.style.display = 'block';
    adminLoginForm.style.display = 'none';
    userToggle.classList.add('active');
    adminToggle.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    adminLoginForm.style.display = 'block';
    userToggle.classList.remove('active');
    adminToggle.classList.add('active');
  }
}

// Login as admin
function loginAsAdmin(username, password, submitBtn, originalText) {
  authService.loginAsAdmin(username, password)
    .then(admin => {
      showMessage('Login successful!', true);
      
      // Redirect to admin page or specified redirect URL
      const redirectUrl = getRedirectUrl() || 'admin_products.html';
      window.location.href = redirectUrl;
    })
    .catch(error => {
      showMessage(error, false);
      
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}

// Login as customer
function loginAsCustomer(username, password, submitBtn, originalText) {
  authService.loginAsCustomer(username, password)
    .then(data => {
      showMessage('Login successful!', true);
      
      localStorage.setItem('customer_id', data.customer_id);
      localStorage.setItem('customer_name', data.name);
      localStorage.setItem('customer_email', data.email);

      const redirectUrl = getRedirectUrl() || 'web.html';
      window.location.href = redirectUrl;
    })
    .catch(error => {
      showMessage(error, false);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
}


// Check for redirect parameter
function checkRedirect() {
  const redirectUrl = getRedirectUrl();
  
  if (redirectUrl) {
    showMessage('Please login to continue', false);
  }
}

// Get redirect URL from query parameter
function getRedirectUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect');
}

// Show message to user
function showMessage(message, isSuccess) {
  if (!messageContainer) return;
  
  messageContainer.textContent = message;
  messageContainer.className = isSuccess ? 'success' : 'error';
  messageContainer.style.display = 'block';
  
  // Hide message after 5 seconds
  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, 5000);
} 