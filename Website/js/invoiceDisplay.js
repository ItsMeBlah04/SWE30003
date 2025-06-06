console.log('Invoice Display Script Loaded');
console.log('LocalStorage Data:', localStorage);

document.addEventListener('DOMContentLoaded', () => {
    const invoiceId = JSON.parse(localStorage.getItem('invoice_info') || '{}').invoice_id || 'N/A';
    const orderId = JSON.parse(localStorage.getItem('order_info') || '{}').order_id || 'N/A';
    const customerInfo = JSON.parse(localStorage.getItem('customer_info') || '{}');
    const customerName = customerInfo.name || 'N/A';
    const customerEmail = customerInfo.email || 'N/A';
    const customerPhone = customerInfo.phone || 'N/A';
    const customerAddress = customerInfo.address || 'N/A';
    const cartItems = JSON.parse(localStorage.getItem('guestCartItems') || '[]');
    const paymentMethod = localStorage.getItem('payment_method') || 'N/A';
    const orderTotal = localStorage.getItem('order_total') || '0.00';
    const shipment = JSON.parse(localStorage.getItem('shipment_info') || '{}');
    const trackingNumber = shipment.tracking_number || 'N/A';
    const shipmentStatus = shipment.status || 'N/A';
    const orderDate = new Date(localStorage.getItem('order_date') || new Date()).toLocaleString();
    const currentDate = new Date(localStorage.getItem('curent_date') || new Date()).toLocaleString();

    document.getElementById('invoice-id').textContent = invoiceId;
    document.getElementById('order-id').textContent = orderId;
    document.getElementById('customer-name').textContent = customerName;
    document.getElementById('customer-email').textContent = customerEmail;
    document.getElementById('customer-phone').textContent = customerPhone;
    document.getElementById('customer-address').textContent = customerAddress;
    document.getElementById('payment-method').textContent = paymentMethod;
    document.getElementById('shipment-id').textContent = shipment.shipment_id || 'N/A';
    document.getElementById('tracking-number').textContent = trackingNumber;
    document.getElementById('shipment-status').textContent = (shipmentStatus === "peding") ? "pending" : shipmentStatus;
    document.getElementById('order-date').textContent = orderDate;
    document.getElementById('current-date').textContent = currentDate;
    document.getElementById('order-total').textContent = `${parseFloat(orderTotal).toFixed(2)}`;

    const itemsTable = document.getElementById('product-list');
    cartItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.quantity}</td>
            <td>$${parseFloat(item.price).toFixed(2)}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
        `;
        itemsTable.appendChild(row);
    });

    const toast = document.getElementById('toast-notification');
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 4000);

    const downloadBtn = document.getElementById('download-pdf');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const invoiceContent = document.querySelector('.invoice-container');
            const opt = {
                margin:       0.5,
                filename:     `Invoice_${invoiceId || 'Unknown'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(invoiceContent).save();
        });
    }


    const homeBtn = document.querySelector('.home-button');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            const customer_id = localStorage.getItem('customer_id');
            const customer_name = localStorage.getItem('customer_name');
            const customer_email = localStorage.getItem('customer_email');

            localStorage.clear();

            if (customer_id) localStorage.setItem('customer_id', customer_id);
            if (customer_name) localStorage.setItem('customer_name', customer_name);
            if (customer_email) localStorage.setItem('customer_email', customer_email);

            window.location.href = 'web.html';
        });
    }
});
