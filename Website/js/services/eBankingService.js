class PayPalPaymentService extends BasePaymentService {
  constructor() {
    super();
    this.paymentMethod = 'paypal';
  }

  validatePaymentDetails(details) {
    const { email, name, country } = details;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error("A valid PayPal email is required.");
    }

    if (!name || name.trim().length < 2) {
      throw new Error("Account holder name must be at least 2 characters.");
    }

    if (!country) {
      throw new Error("Please select a billing country.");
    }

    return true;
  }
}