class NavbarManager {
  constructor() {
    this.customerId = localStorage.getItem('customer_id');
    this.trackLink = document.getElementById('track-link');
    this.loginBtn = document.getElementById('loginBtn') || document.getElementById('login-logout-btn');
    this.logoutBtn = document.getElementById('logoutBtn');
  }

  init() {
    if (this.customerId) {
      this.showCustomerNav();
    } else {
      this.showGuestNav();
    }
  }

  showCustomerNav() {
    if (this.trackLink) this.trackLink.style.display = 'inline-block';

    if (this.logoutBtn) {
      this.logoutBtn.style.display = 'inline-block';
      this.logoutBtn.addEventListener('click', this.logout.bind(this));
    }

    if (this.loginBtn) {
      this.loginBtn.style.display = 'none';
    }
  }

  showGuestNav() {
    if (this.trackLink) this.trackLink.style.display = 'none';
    if (this.logoutBtn) this.logoutBtn.style.display = 'none';
    if (this.loginBtn) {
      this.loginBtn.style.display = 'inline-block';
      this.loginBtn.textContent = 'Login';
    }
  }

  logout(event) {
    event.preventDefault();
    localStorage.removeItem('customer_id');
    window.location.href = 'login_signup.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NavbarManager().init();
});
