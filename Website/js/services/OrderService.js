class OrderService {
  constructor() {
    this.apiUrl = "../php/orderHandle.php";
  }

  placeOrder(customerID, totalAmount) {
    return new Promise((resolve, reject) => {
      if (!customerID || !totalAmount) {
        reject(new Error('Customer ID and total amount are required'));
        return;
      }

      const formData = new FormData();
      formData.append('action', 'place_order');
      formData.append('customer_id', customerID);
      formData.append('total_amount', totalAmount);

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
            reject(new Error(data.message || 'Failed to place order'));
          }
        })
        .catch(reject);
    });
  }
}