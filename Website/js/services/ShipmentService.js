console.log('Shipment Service Loaded');

class ShipmentService {
    constructor() {
        this.apiUrl = '../php/shipmentHandle.php';
    }

    createShipment(orderId, trackingNumber) {
        return new Promise((resolve, reject) => {
            if (!orderId || !trackingNumber) {
                reject(new Error('Missing orderId, trackingNumber'));
                return;
            }

            const formData = new FormData();
            formData.append('action', 'create_shipment');
            formData.append('order_id', orderId);
            formData.append('tracking_number', trackingNumber);

            fetch(this.apiUrl, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(10000)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.message || 'Failed to create shipment.'));
                    }
                })
                .catch(reject);
        });
    }

    getShipmentsByCustomer(customerId) {
        return new Promise((resolve, reject) => {
            if (!customerId) {
                reject(new Error('Missing customerId'));
                return;
            }

            const formData = new FormData();
            formData.append('action', 'get_shipments_by_customer_id');
            formData.append('customer_id', customerId);

            fetch(this.apiUrl, {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(10000)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        resolve(data.data); 
                    } else {
                        reject(new Error(data.message || 'Failed to fetch shipments.'));
                    }
                })
                .catch(reject);
        });
    }
}