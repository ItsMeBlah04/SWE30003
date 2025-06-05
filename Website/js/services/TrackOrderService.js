// /js/services/TrackOrderService.js
const BASE_URL = '../php/track_order.php';

export default class TrackOrderService {
  static async trackByOrderId(orderId) {
    const url = `${BASE_URL}?order_id=${encodeURIComponent(orderId.trim())}`;
    console.log("Final Fetch URL (Order ID):", url);
    const res = await fetch(url);
    const text = await res.text();
    console.log(" Raw response:", text);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON: " + text);
    }
  }

  static async trackByNameAndContact(name, email, phone) {
    const params = new URLSearchParams();
    if (name.trim()) params.append('name', name.trim());
    if (email.trim()) params.append('email', email.trim());
    if (phone.trim()) params.append('phone', phone.trim());

    const url = `${BASE_URL}?${params.toString()}`;
    console.log(" Final Fetch URL (Name+Contact):", url);
    const res = await fetch(url);
    const text = await res.text();
    console.log(" Raw response:", text);
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON: " + text);
    }
  }
}
