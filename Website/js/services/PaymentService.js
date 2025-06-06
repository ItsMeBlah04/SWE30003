class BasePaymentService {
    constructor() {
        if (this.constructor === BasePaymentService) {
            throw new Error("Cannot instantiate abstract class BasePaymentService");
        }

        this.apiUrl = '../php/paymentHandle.php'; 
        this.paymentMethod = null; 
    }

    processPayment(orderId, amount) {
        return new Promise((resolve, reject) => {
            if (!orderId || !amount || !this.paymentMethod) {
                reject(new Error('Missing orderId, amount, or payment method'));
                return;
            }

            const formData = new FormData();
            formData.append('action', 'update_payment');
            formData.append('order_id', orderId);
            formData.append('payment_method', this.paymentMethod);
            formData.append('amount', amount);

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
                        reject(new Error(data.message || 'Failed to update payment.'));
                    }
                })
                .catch(reject);
        });
    }

    validatePaymentDetails(...args) {
        throw new Error("Method 'validatePaymentDetails()' must be implemented.");
    }
}