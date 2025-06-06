console.log("localStorage:", localStorage);

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("login-logout-btn"); 
  const logoutBtn = document.getElementById("logout-btn");

  const customerId = localStorage.getItem("customer_id");
  const customerName = localStorage.getItem("customer_name");

  if (customerId && customerName) {
    if (loginBtn) {
      loginBtn.textContent = `Hello, ${customerName}`;
      loginBtn.href = "../html/login_signup.html"; 
      loginBtn.classList.remove("btn");
    }

    // Show logout button inside form
    if (logoutBtn) {
      logoutBtn.style.display = "block";
      logoutBtn.addEventListener("click", function () {
        localStorage.clear();
        location.reload(); 
      });
    }
  }
});
