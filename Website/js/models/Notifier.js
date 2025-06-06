// /js/models/notifier.js

export default class Notifier {
  constructor(apiUrl = '/Website/SWE30003/Website/php/track_order.php?action=notify') {
    this.apiUrl = apiUrl;
  }

  async send(customerId, type, content) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, type, content })
      });

      const text = await response.text();
      console.log("Raw response:", text);

      const data = JSON.parse(text);

      if (!data.success) {
        console.error('Notification failed:', data);
      } else {
        console.log('Notification sent successfully');
      }

      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      return { error: error.message };
    }
  }
}
