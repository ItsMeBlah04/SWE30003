/**
 * Session Management
 * Handles session-related functionality
 */

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  updateLoginLogoutButton();
  updateWelcomeMessage();
});

// Update the login/logout button based on authentication status
function updateLoginLogoutButton() {
  const loginLogoutBtn = document.getElementById('login-logout-btn');
  
  if (!loginLogoutBtn) {
    return;
  }
  
  // Check if user is authenticated
  const isAdminAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  const isCustomerAuthenticated = sessionStorage.getItem('isCustomerAuthenticated') === 'true';
  
  if (isAdminAuthenticated || isCustomerAuthenticated) {
    // User is logged in
    loginLogoutBtn.textContent = 'Logout';
    loginLogoutBtn.href = '#';
    loginLogoutBtn.onclick = logout;
  } else {
    // User is not logged in
    loginLogoutBtn.textContent = 'Login';
    loginLogoutBtn.href = 'login_signup.html';
    loginLogoutBtn.onclick = null;
  }
}

// Update welcome message if admin is logged in
function updateWelcomeMessage() {
  const adminNameElement = document.getElementById('admin-name');
  
  if (!adminNameElement) {
    return;
  }
  
  // Check if admin is authenticated
  const isAdminAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  
  if (isAdminAuthenticated) {
    // Admin is logged in
    const adminName = sessionStorage.getItem('admin_name');
    adminNameElement.textContent = adminName || 'Admin';
    
    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }
}

// Logout function
function logout() {
  // Clear session storage
  sessionStorage.removeItem('admin_id');
  sessionStorage.removeItem('admin_name');
  sessionStorage.removeItem('admin_email');
  sessionStorage.removeItem('isAuthenticated');
  sessionStorage.removeItem('customer_id');
  sessionStorage.removeItem('customer_name');
  sessionStorage.removeItem('isCustomerAuthenticated');
  
  // Redirect to login page
  window.location.href = 'login_signup.html';
} 