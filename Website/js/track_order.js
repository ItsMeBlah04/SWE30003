import TrackOrderService from './services/TrackOrderService.js';
import { sendNotification } from './models/Notifier.js';  

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('track-order-form');
  const resultContainer = document.getElementById('result-container');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const orderId = formData.get("order_id")?.trim() || "";
    const name = formData.get("name")?.trim() || "";
    const email = formData.get("email")?.trim() || "";
    const phone = formData.get("phone")?.trim() || "";

    resultContainer.innerHTML = 'Loading...';

    try {
      let response;

      if (orderId !== '') {
        response = await TrackOrderService.trackByOrderId(orderId);
      } else if (name && (email || phone)) {
        response = await TrackOrderService.trackByNameAndContact(name, email, phone);
      } else {
        resultContainer.innerHTML = '<p style="color: red">Please enter either Order ID, or Name + Email/Phone.</p>';
        return;
      }

      if (response.error) {
        resultContainer.innerHTML = `<p style="color:red">${response.error}</p>`;
      } else {
        // Show tracking info
        if (response.multiple) {
          resultContainer.innerHTML = response.orders.map(order => `
            <div>
              <p><strong>Order ID:</strong> ${order.order_id}</p>
              <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
              <p><strong>Status:</strong> ${order.status}</p>
              <hr>
            </div>
          `).join('');
        } else {
          resultContainer.innerHTML = `
            <p><strong>Order ID:</strong> ${response.order_id}</p>
            <p><strong>Tracking Number:</strong> ${response.tracking_number}</p>
            <p><strong>Status:</strong> ${response.status}</p>
          `;

          // Send notification after successful track
          const customerId = localStorage.getItem('customer_id') || '';  // Adjust source as needed
          if (customerId) {
            sendNotification(customerId, 'track', `User tracked order ID ${response.order_id}`)
              .then(res => {
                if (!res.success) {
                  console.error('Notification failed:', res);
                } else {
                  console.log('Notification sent');
                }
              })
              .catch(err => console.error('Notification error:', err));
          }
        }
      }
    } catch (err) {
      resultContainer.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
    }
  });
});
