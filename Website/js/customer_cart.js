console.log("customer_cart.js is loaded");

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

  cart.forEach((item, index) => {
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

  // Attach event listeners for remove buttons
  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', () => {
      const idToRemove = parseInt(button.dataset.id);
      const updatedCart = cart.filter(item => item.id !== idToRemove);
      localStorage.setItem('guestCartItems', JSON.stringify(updatedCart));
      renderGuestCart(updatedCart); // re-render
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const customerId = localStorage.getItem('customer_id');

  if (!customerId) {
    document.getElementById('cart-items-list').innerHTML = `
      <p style="color: red; font-weight: bold;">
        ⚠️ You must <a href="login_signup.html">log in</a> to proceed with checkout.
      </p>
    `;

    // Disable form submission
    const paymentForm = document.querySelector('.payment-method');
    paymentForm?.addEventListener('submit', e => {
      e.preventDefault();
      alert('Please log in before completing checkout.');
    });

    return; 
  }

  // Logged in → load and render guest cart (until backend is implemented)
  const cart = JSON.parse(localStorage.getItem('guestCartItems')) || [];
  renderGuestCart(cart);

  const paymentForm = document.querySelector('.payment-method');
  paymentForm?.addEventListener('submit', e => {
    e.preventDefault();
    alert('Payment successful');
    localStorage.removeItem('guestCartItems');
    window.location.href = 'web.html';
  });
});

