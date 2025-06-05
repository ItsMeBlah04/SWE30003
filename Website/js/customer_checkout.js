console.log("customer_checkout.js is loaded");

const paymentForm = document.querySelector('.payment-method');

if (paymentForm) {
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardNumber = document.getElementById('card-number').value;
    const total = parseFloat(document.getElementById('total-amount').textContent.replace('$', '')) || 0;
    const shipping = parseFloat(document.getElementById('shipping-fee-amount').textContent.replace('$', '')) || 0;

    const customerId = localStorage.getItem('customer_id');

    if (!customerId) {
      alert('You must log in to proceed with checkout.');
      return;
    }

    const customerInfoService = new CustomerInformationService();

    try {
      const customerData = await customerInfoService.getCustomerInfo(customerId);
      console.log("Customer Info:", customerData);
      console.log("form_info:", {
        cardNumber,
        total,
        shipping,
        customerId
      });
      console.log("sessionStorage:", localStorage);

      alert(`Order placed for ${customerData.name}, shipping to ${customerData.address}`);
      localStorage.removeItem('guestCartItems');
    } catch (error) {
      console.error("Failed to get customer info:", error.message);
      alert("Could not retrieve your information. Please try again.");
    }
  });
} else {
  console.warn("Payment form not found");
}
