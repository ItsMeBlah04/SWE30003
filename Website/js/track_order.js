const orders = {
  "ORD101": {
    trackingNumber: "TRK123456",
    status: "Shipped"
  },
  "ORD102": {
    trackingNumber: "TRK654321",
    status: "Out for Delivery"
  },
  "ORD103": {
    trackingNumber: "TRK987654",
    status: "Delivered"
  }
};

function trackOrder() {
  const input = document.getElementById("orderId").value.trim().toUpperCase();
  const resultDiv = document.getElementById("result");

  if (orders[input]) {
    const order = orders[input];
    resultDiv.innerHTML = `
      <strong>Order ID:</strong> ${input}<br>
      <strong>Tracking Number:</strong> ${order.trackingNumber}<br>
      <strong>Status:</strong> ${order.status}<br>
       <em>Your order <b>${input}</b> is currently "<b>${order.status}</b>".</em>
    `;
    resultDiv.style.color = "#000";
  } else {
    resultDiv.innerHTML = `<span style="color:red;">Order not found, please try again.</span>`;
  }
}
