console.log("customer_cart_checkout.js is loaded");
console.log("Its Me Blah");
console.log(localStorage);

let selectedPaymentMethod = null;

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

  document.querySelectorAll('.remove-btn').forEach(button => {
    button.addEventListener('click', () => {
      const idToRemove = parseInt(button.dataset.id);
      const updatedCart = cart.filter(item => item.id !== idToRemove);
      localStorage.setItem('guestCartItems', JSON.stringify(updatedCart));
      renderGuestCart(updatedCart);
    });
  });
}

function showToast(message, success = true) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.backgroundColor = success ? '#28a745' : '#dc3545'; // Green or red
  toast.className = 'toast show';

  setTimeout(() => {
    toast.className = 'toast';
  }, 3000); // Hide after 3 seconds
}


document.addEventListener('DOMContentLoaded', () => {
  const customerId = localStorage.getItem('customer_id');

  if (!customerId) {
    document.getElementById('cart-items-list').innerHTML = `
      <p style="color: red; font-weight: bold;">
        ⚠️ You must <a href="login_signup.html">log in</a> to proceed with checkout.
      </p>
    `;
    return;
  }

  const cart = JSON.parse(localStorage.getItem('guestCartItems')) || [];
  renderGuestCart(cart);

  const customerInfoService = new CustomerInformationService();
  const orderService = new OrderService();
  const invoiceService = new InvoiceService();
  const shipmentService = new ShipmentService();

  document.getElementById('select-card').addEventListener('click', () => {
    selectedPaymentMethod = 'card';
    document.getElementById('card-section').style.display = 'block';
    document.getElementById('paypal-section').style.display = 'none';
  });

  document.getElementById('select-paypal').addEventListener('click', () => {
    selectedPaymentMethod = 'paypal';
    document.getElementById('paypal-section').style.display = 'block';
    document.getElementById('card-section').style.display = 'none';
  });

  document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const activeBtn = document.activeElement;
    const submitterId = activeBtn?.id;
    const total = parseFloat(document.getElementById('total-amount').textContent.replace('$', '')) || 0;

    if (!submitterId || !customerId) {
      showToast("❌ Something went wrong. Please log in again.", false);
      return;
    }

    try {
      const customerData = await customerInfoService.getCustomerInfo(customerId);
      const orderData = await orderService.placeOrder(customerId, total);
      // randomly generate tax numbers with 6 digits
      const tax = Math.floor(Math.random() * 900000) + 100000; // Generates a random 6-digit number
      const invoiceData = await invoiceService.createInvoice(orderData.order_id, tax, total);
      // randomly generate tracking number with 4 digits
      const trackingNumber = Math.floor(Math.random() * 9000) + 1000; // Generates a random 4-digit number
      const shipmentData = await shipmentService.createShipment(orderData.order_id, trackingNumber);

      if (submitterId === 'pay-card') {
        const cardDetails = {
          cardNumber: document.getElementById('card-number')?.value.trim(),
          expiryDate: document.getElementById('card-expiry')?.value.trim(),
          cvv: document.getElementById('card-cvc')?.value.trim(),
          name: document.getElementById('card-name')?.value.trim()
        };

        if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv || !cardDetails.name) {
          showToast('❌ Please complete all card fields.', false);
          return;
        }

        const cardService = new CardPaymentService();
        cardService.validatePaymentDetails(cardDetails);
        await cardService.processPayment(orderData.order_id, total);
        showToast('✅ Card payment successful!');
      }

      if (submitterId === 'pay-paypal') {
        const paypalDetails = {
          email: document.getElementById('paypal-email')?.value.trim(),
          name: document.getElementById('paypal-name')?.value.trim(),
          country: document.getElementById('paypal-country')?.value
        };

        if (!paypalDetails.email || !paypalDetails.name || !paypalDetails.country) {
          showToast('❌ Please complete all PayPal fields.', false);
          return;
        }

        const paypalService = new PayPalPaymentService();
        paypalService.validatePaymentDetails(paypalDetails);
        await paypalService.processPayment(orderData.order_id, total);
        showToast('✅ PayPal payment successful!');
      }

      // localStorage.removeItem('guestCartItems');

      // save all data to localStorage
      localStorage.setItem('order_info', JSON.stringify(orderData));
      localStorage.setItem('order_total', total.toFixed(2));
      localStorage.setItem('customer_info', JSON.stringify(customerData));
      localStorage.setItem('payment_method', selectedPaymentMethod);
      localStorage.setItem('curent_date', new Date().toISOString());
      localStorage.setItem('invoice_info', JSON.stringify(invoiceData));
      localStorage.setItem('shipment_info', JSON.stringify(shipmentData));
      localStorage.setItem('total_amount', total.toFixed(2));

      window.location.href = 'invoice.html';

    } catch (error) {
      console.error(`${submitterId} Payment Error:`, error);
      showToast(`❌ ${submitterId === 'pay-card' ? 'Card' : 'PayPal'} Payment failed: ${error.message}`, false);
    }
  });
});