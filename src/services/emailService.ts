const ACCESS_KEY = (import.meta as any).env.VITE_WEB3FORMS_KEY || 'bee6658a-e1f9-4bae-ba1a-52261a2b0bd8';
const API_URL = 'https://api.web3forms.com/submit';

export const emailService = {
  async sendEmail(to: string, subject: string, message: string) {
    if (!ACCESS_KEY) {
      console.warn('Maison: Web3Forms access key not found');
      return;
    }
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          email: to,
          subject: subject,
          message: message,
          from_name: 'UFR Collection'
        })
      });
      const result = await response.json();
      if (!result.success) {
        console.error('Web3Forms Error:', result);
      }
    } catch (error) {
      console.error('Email error:', error);
    }
  },

  async sendOrderConfirmation(order: any) {
    const itemsList = order.items.map((item: any) => `- ${item.name} (${item.size}) x ${item.quantity}`).join('\n');
    const message = `
Hello ${order.customer.firstName},

Your order ${order.orderId} has been confirmed.

Order Details:
${itemsList}

Total Amount: PKR ${order.total}
Payment Method: ${order.paymentMethod.toUpperCase()}
Shipping Address: ${order.customer.address}, ${order.customer.city}

${order.luckyDrawToken ? `LUCKY DRAW TOKEN: ${order.luckyDrawToken}` : ''}

Thank you for choosing UFR Collection.
    `;
    await this.sendEmail(order.customer.email, `Order Confirmation - ${order.orderId}`, message);
  },

  async sendStatusUpdate(order: any) {
    const message = `
Hello ${order.customer.firstName},

The status of your order ${order.orderId} has been updated.

New Status: ${order.status.toUpperCase()}
${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}` : ''}

You can track your order on our website.

Best regards,
UFR Collection
    `;
    await this.sendEmail(order.customer.email, `Order Status Update - ${order.orderId}`, message);
  },

  async sendAdminOrderAlert(order: any) {
    const itemsList = order.items.map((item: any) => `- ${item.name} (${item.size}) x ${item.quantity}`).join('\n');
    const message = `
New order received!

Order ID: ${order.orderId}
Customer: ${order.customer.firstName} ${order.customer.lastName}
Email: ${order.customer.email}
Phone: ${order.customer.phone}

Items:
${itemsList}

Total: PKR ${order.total}
Payment Method: ${order.paymentMethod.toUpperCase()}
TrxID: ${order.trxId || 'N/A'}

Login to admin panel to manage this order.
    `;
    await this.sendEmail('admin@ufrcollection.com', `New Order Received - ${order.orderId}`, message);
  },

  async sendWelcomeEmail(user: any) {
    const message = `
Hello ${user.name || 'Valued Client'},

Welcome to UFR Collection. We are honored to have you join our exclusive archive.

Explore our latest collections and stay tuned for upcoming seasonal heritage pieces.

Best regards,
UFR Collection Team
    `;
    await this.sendEmail(user.email, 'Welcome to UFR Collection', message);
  }
};
