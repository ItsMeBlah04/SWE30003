export async function sendNotification(customerId, type, content) {
  try {
    const response = await fetch('/Website/SWE30003/Website/php/track_order.php?action=notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerId,
        type: type,
        content: content
      })
    });

    const text = await response.text();
    console.log(" Raw response:", text);

    const data = JSON.parse(text);

    if (!data.success) {
      console.error(' Notification failed:', data);
    } else {
      console.log(' Notification sent successfully');
    }

    return data;
  } catch (error) {
    console.error(' Error sending notification:', error);
    return { error: error.message };
  }
}
