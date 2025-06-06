// /js/services/shipment.js

export default class ShipmentService {
  constructor(apiUrl = '/php/track_order.php?action=update_shipment') {
    this.apiUrl = apiUrl;
  }

  async update(orderId, status) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Shipment update failed:', data);
      } else {
        console.log('Shipment status updated successfully');
      }

      return data;
    } catch (error) {
      console.error('Error updating shipment:', error);
      return { error: error.message };
    }
  }
}
