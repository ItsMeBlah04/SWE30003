class CardPaymentService extends BasePaymentService {
    constructor() {
        super();
        this.paymentMethod = 'card';
    }

    validatePaymentDetails({ cardNumber, expiryDate, cvv }) {
        if (!cardNumber) throw new Error("Card number is required.");
        const digitsOnly = cardNumber.replace(/\D/g, '');
        if (digitsOnly.length < 13 || digitsOnly.length > 19) {
            throw new Error("Card number must be 13–19 digits.");
        }

        const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiryDate || !expiryRegex.test(expiryDate)) {
            throw new Error("Expiry date must be in MM/YY format.");
        }

        const cvvRegex = /^\d{3,4}$/;
        if (!cvv || !cvvRegex.test(cvv)) {
            throw new Error("CVV must be 3 or 4 digits.");
        }

        return true;
    }
}
