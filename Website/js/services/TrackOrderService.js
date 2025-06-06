// /js/services/TrackOrderService.js

export default class TrackOrderService {
  constructor(baseUrl = '../php/track_order.php') {
    this.baseUrl = baseUrl;
  }

  async trackByOrderId(orderId) {
    const url = `${this.baseUrl}?order_id=${encodeURIComponent(orderId.trim())}`;
    console.log("Final Fetch URL (Order ID):", url);

    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log("Raw response:", text);
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON response: " + err.message);
    }
  }

  async trackByNameAndContact(name, email, phone) {
    const params = new URLSearchParams();
    if (name.trim()) params.append('name', name.trim());
    if (email.trim()) params.append('email', email.trim());
    if (phone.trim()) params.append('phone', phone.trim());

    const url = `${this.baseUrl}?${params.toString()}`;
    console.log("Final Fetch URL (Name+Contact):", url);

    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log("Raw response:", text);
      return JSON.parse(text);
    } catch (err) {
      throw new Error("Invalid JSON response: " + err.message);
    }
  }
}
