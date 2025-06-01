// session.js
// Handles login/logout button state and session management

document.addEventListener('DOMContentLoaded', function() {
  const btn = document.getElementById('login-logout-btn');
  if (!btn) return;

  // Check login state (localStorage)
  function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  function setLoggedOut() {
    localStorage.removeItem('isLoggedIn');
    btn.textContent = 'Login';
    btn.setAttribute('href', 'login_signup.html');
    btn.onclick = null;
  }

  function setLoggedIn() {
    btn.textContent = 'Logout';
    btn.removeAttribute('href');
    btn.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem('isLoggedIn');
      location.reload();
    };
  }

  // Set initial state
  if (isLoggedIn()) {
    setLoggedIn();
  } else {
    setLoggedOut();
  }

  // Listen for login event from auth.js
  window.addEventListener('user-logged-in', function() {
    localStorage.setItem('isLoggedIn', 'true');
    setLoggedIn();
  });

  // Session timeout (30 minutes = 1800000 ms)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  let timeoutId = null;

  function startSessionTimer() {
    clearSessionTimer();
    timeoutId = setTimeout(() => {
      // On timeout, log out and redirect to login
      localStorage.removeItem('isLoggedIn');
      setLoggedOut();
      window.location.href = 'login_signup.html';
    }, SESSION_TIMEOUT);
  }

  function clearSessionTimer() {
    if (timeoutId) clearTimeout(timeoutId);
  }

  function resetSessionTimer() {
    if (isLoggedIn()) {
      startSessionTimer();
    }
  }

  // Reset timer on user activity
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, resetSessionTimer, true);
  });

  // If logged in, start timer
  if (isLoggedIn()) {
    startSessionTimer();
  }
}); 