class InvoiceService {
    constructor() {
        this.apiUrl = '../php/invoiceHandle.php';
    }

    createInvoice(orderId, tax, amount) {
        return new Promise((resolve, reject) => {
            if (!orderId || !amount || !tax) {
                reject(new Error('Missing orderId or amount or tax'));
                return;
            }

            const formData = new FormData();
            formData.append('action', 'create_invoice');
            formData.append('order_id', orderId);
            formData.append('tax', tax);
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
                        reject(new Error(data.message || 'Failed to create invoice.'));
                    }
                })
                .catch(reject);
        });
    }
}