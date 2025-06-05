console.log("customer_cart_checkout.js is loaded");
console.log("Its Me Blah")
console.log(localStorage)

// Utility function to render cart
function renderGuestCart(cart) {
  const cartItemsList = document.getElementById('cart-items-list');
  const subtotalAmountEl = document.getElementById('subtotal-amount');
  const shippingFeeAmountEl = document.getElementById('shipping-fee-amount');
  const totalAmountEl = document.getElementById('total-amount');

  let subtotal = 0;
  cartItemsList.innerHTML = '';

  if (cart.length === 0) {
    cartItemsList.innerHTML = '<p>Your cart is empty.</p>';
    subtotalAmountEl.textContent = '$0.00';
    shippingFeeAmountEl.textContent = '$0.00';
    totalAmountEl.textContent = '$0.00';
    return;
  }

  cart.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'product';

    const total = item.price * item.quantity;
    subtotal += total;

    itemDiv.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>$${total.toFixed(2)}</span>
      <button class="remove-btn" data-id="${item.id}">Remove</button>
    `;

    cartItemsList.appendChild(itemDiv);
  });

  const shippingFee = subtotal > 0 ? 10 : 0;
  subtotalAmountEl.textContent = `$${subtotal.toFixed(2)}`;
  shippingFeeAmountEl.textContent = `$${shippingFee.toFixed(2)}`;
  totalAmountEl.textContent = `$${(subtotal + shippingFee).toFixed(2)}`;

  // Remove item from cart
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', () => {
      const idToRemove = parseInt(button.dataset.id);
      const updatedCart = cart.filter(item => item.id !== idToRemove);
      localStorage.setItem('guestCartItems', JSON.stringify(updatedCart));
      renderGuestCart(updatedCart);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const customerId = localStorage.getItem('customer_id');

  if (!customerId) {
    // Not logged in
    document.getElementById('cart-items-list').innerHTML = `
      <p style="color: red; font-weight: bold;">
        ⚠️ You must <a href="login_signup.html">log in</a> to proceed with checkout.
      </p>
    `;

    // Prevent submission
    const paymentForm = document.querySelector('.payment-method');
    paymentForm?.addEventListener('submit', e => {
      e.preventDefault();
      alert('Please log in before completing checkout.');
    });

    return;
  }

  // Load and render guest cart
  const cart = JSON.parse(localStorage.getItem('guestCartItems')) || [];
  renderGuestCart(cart);

  const paymentForm = document.querySelector('.payment-method');
  if (!paymentForm) {
    console.warn("Payment form not found");
    return;
  }

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('card-number')?.value;
    const total = parseFloat(document.getElementById('total-amount').textContent.replace('$', '')) || 0;
    const shipping = parseFloat(document.getElementById('shipping-fee-amount').textContent.replace('$', '')) || 0;
    const cartItems = JSON.parse(localStorage.getItem('guestCartItems')) || [];
    const productIds = cartItems.map(item => item.id);

    const customerInfoService = new CustomerInformationService();

    try {
      const customerData = await customerInfoService.getCustomerInfo(customerId);
      console.log("data has been retrieved");
      console.log("form_info:", { cardNumber, total, shipping, customerId, productIds });
      console.log("sessionStorage:", localStorage);
      console.log("customerData:", customerData);

      alert(`Order placed for ${customerData.name}, shipping to ${customerData.address}`);

      // Clear cart
      localStorage.removeItem('guestCartItems');
      // window.location.href = 'web.html';
    } catch (error) {
      console.error("Failed to get customer info:", error.message);
      alert("Could not retrieve your information. Please try again.");
    }
  });
});
