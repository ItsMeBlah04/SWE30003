console.log("CustomerInformationService.js is loaded");

class CustomerInformationService {
  constructor() {
    this.apiUrl = '../php/customerInfoHandle.php';
  }

  getCustomerInfo(customerId) {
    return new Promise((resolve, reject) => {
      if (!customerId) {
        reject(new Error('Customer ID is required'));
        return;
      }

      const formData = new FormData();
      formData.append('action', 'get_customer_info');
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
            reject(new Error(data.message || 'Failed to fetch customer information'));
          }
        })
        .catch(reject);
    });
  }
}