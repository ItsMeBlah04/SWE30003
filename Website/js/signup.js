// signup.js
console.log("signup.js is loaded");

// Initialize service
const authService = new AuthService();

// DOM Elements
const signupForm = document.getElementById('signup-form');
const messageContainer = document.getElementById('message-container');

if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data using name attributes
    const first_name = this.querySelector('input[name="first_name"]').value.trim();
    const last_name = this.querySelector('input[name="last_name"]').value.trim();
    const email = this.querySelector('input[name="email"]').value.trim();
    const phone = this.querySelector('input[name="phone"]').value.trim();
    const address = this.querySelector('input[name="address"]').value.trim();
    const password = this.querySelector('input[name="password"]').value;

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

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

function showMessage(message, isSuccess) {
  if (!messageContainer) return;

  messageContainer.textContent = message;
  messageContainer.className = isSuccess ? 'success' : 'error';
  messageContainer.style.display = 'block';

  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, 5000);
}
