/**
 * Main JavaScript file
 * Loads all model and service classes
 */

// Check if we're running in a browser environment
if (typeof window !== 'undefined') {
  // Initialize authentication check on page load
  document.addEventListener('DOMContentLoaded', function() {
    // Check if auth service is available
    if (typeof AuthService !== 'undefined') {
      const authService = new AuthService();
      
      // Check if current page requires authentication
      authService.checkAuthRequired();
    }
  });
} 