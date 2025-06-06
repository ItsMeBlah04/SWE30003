console.log('Tracking Order Script Loaded');

document.addEventListener('DOMContentLoaded', async () => {
    const customerId = JSON.parse(localStorage.getItem('customer_id') || '{}');

    const orderListEl = document.getElementById('order-list');

    if (!customerId) {
        orderListEl.innerHTML = '<p>Please log in to view your orders.</p>';
        return;
    }

    const shipmentService = new ShipmentService();

    try {
        const response = await shipmentService.getShipmentsByCustomer(customerId);
        const shipments = response.data;

        if (!Array.isArray(shipments) || shipments.length === 0) {
            orderListEl.innerHTML = '<p>You have no orders yet.</p>';
            return;
        }

        orderListEl.innerHTML = '<div class="order-card-container"></div>';
        const container = orderListEl.querySelector('.order-card-container');

        shipments.forEach(shipment => {
            const card = document.createElement('div');
            const rawStatus = (shipment.status || '').toLowerCase();
            const status = rawStatus === 'peding' ? 'pending' : rawStatus || 'N/A';
            const tracking = shipment.tracking_number || 'N/A';

            card.className = 'order-card';
            card.innerHTML = `
                <h3>Order ID: ${shipment.order_id}</h3>
                <p class="order-detail"><span>Tracking Number:</span> ${tracking}</p>
                <p class="order-detail"><span>Status:</span> ${status}</p>
            `;

            container.appendChild(card); 
        });
    } catch (error) {
        console.error('Error fetching shipments:', error);
        orderListEl.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
    }
});
