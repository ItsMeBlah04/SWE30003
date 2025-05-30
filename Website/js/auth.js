// Toggle between login and signup forms
function toggleForms() {
  const loginForm = document.getElementById('login-form');
  const adminLoginForm = document.getElementById('admin-login-form');
  const signupForm = document.getElementById('signup-form');
  const title = document.getElementById('form-title');
  const toggleLink = document.querySelector('.toggle-link');
  const userToggle = document.getElementById('user-toggle');
  const adminToggle = document.getElementById('admin-toggle');
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
  const loginForm = document.getElementById('login-form');
  const adminLoginForm = document.getElementById('admin-login-form');
  const userToggle = document.getElementById('user-toggle');
  const adminToggle = document.getElementById('admin-toggle');

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

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
  // User login form submission
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a real application, you would validate credentials with a server
    // For this demo, just redirect to the main page
    window.location.href = 'web.html';
  });
  
  // Admin login form submission
  document.getElementById('admin-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // For demo purposes, any admin login redirects to the admin product page
    // In a real application, you would validate admin credentials with a server
    window.location.href = 'admin_products.html';
  });
  
  // Signup form submission
  document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    // In a real application, you would send the signup data to a server
    // For this demo, just redirect to the main page
    alert('Account created successfully!');
    window.location.href = 'web.html';
  });
}); 