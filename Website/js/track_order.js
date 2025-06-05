import TrackOrderService from './services/TrackOrderService.js';
import Notifier from './models/notifier.js';

class TrackOrderController {
  constructor(formId, resultContainerId) {
    this.form = document.getElementById(formId);
    this.resultContainer = document.getElementById(resultContainerId);
    this.notifier = new Notifier();
    this.trackService = new TrackOrderService(); 
    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(this.form);

    const orderId = formData.get("order_id")?.trim() || "";
    const name = formData.get("name")?.trim() || "";
    const email = formData.get("email")?.trim() || "";
    const phone = formData.get("phone")?.trim() || "";

    this.resultContainer.innerHTML = 'Loading...';

    try {
      let response;

      if (orderId !== '') {
        response = await this.trackService.trackByOrderId(orderId);
      } else if (name && (email || phone)) {
        response = await this.trackService.trackByNameAndContact(name, email, phone);
      } else {
        this.displayError('Please enter either Order ID, or Name + Email/Phone.');
        return;
      }

      if (response.error) {
        this.displayError(response.error);
      } else {
        this.displayTrackingResult(response);

        const customerId = localStorage.getItem('customer_id') || '';
        if (customerId) {
          if (response.multiple && Array.isArray(response.orders)) {
            // Send notification for each order tracked by name+email
            for (const order of response.orders) {
              await this.notifier.send(customerId, 'track', `User tracked order ID ${order.order_id}`);
            }
          } else if (response.order_id) {
            // Single order notification
            await this.notifier.send(customerId, 'track', `User tracked order ID ${response.order_id}`);
          }
        }
      }
    } catch (err) {
      this.displayError(`Error: ${err.message}`);
    }
  }

  displayTrackingResult(response) {
    if (response.multiple && Array.isArray(response.orders)) {
      this.resultContainer.innerHTML = response.orders.map(order => `
        <div>
          <p><strong>Order ID:</strong> ${order.order_id}</p>
          <p><strong>Tracking Number:</strong> ${order.tracking_number}</p>
          <p><strong>Status:</strong> ${order.status}</p>
          <hr>
        </div>
      `).join('');
    } else {
      this.resultContainer.innerHTML = `
        <p><strong>Order ID:</strong> ${response.order_id}</p>
        <p><strong>Tracking Number:</strong> ${response.tracking_number}</p>
        <p><strong>Status:</strong> ${response.status}</p>
      `;
    }
  }

  displayError(message) {
    this.resultContainer.innerHTML = `<p style="color:red">${message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TrackOrderController('track-order-form', 'result-container');
});
