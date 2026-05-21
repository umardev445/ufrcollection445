const ACCESS_KEY = (import.meta as any).env.VITE_WEB3FORMS_KEY || 'bee6658a-e1f9-4bae-ba1a-52261a2b0bd8';
const API_URL = 'https://api.web3forms.com/submit';

// Admin email address (change to your email)
const ADMIN_EMAIL = 'umardev750@gmail.com';

export const emailService = {
  // Core email sending function
  async sendEmail(to: string, subject: string, message: string, isHtml: boolean = false) {
    if (!ACCESS_KEY) {
      console.warn('Maison: Web3Forms access key not found');
      return false;
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
      if (result.success) {
        console.log(`✅ Email sent to: ${to}`);
        return true;
      } else {
        console.error('Web3Forms Error:', result);
        return false;
      }
    } catch (error) {
      console.error('Email error:', error);
      return false;
    }
  },

  // ✅ CUSTOMER ONLY - Order Confirmation Email
  async sendOrderConfirmation(order: any) {
    const itemsList = order.items.map((item: any) => 
      `• ${item.name} (Size: ${item.size || 'One Size'}, Color: ${item.color || 'Standard'}) x ${item.quantity}`
    ).join('\n');
    
    const message = `
╔══════════════════════════════════════════════════════╗
║              UFR COLLECTION - ORDER CONFIRMED        ║
╚══════════════════════════════════════════════════════╝

Dear ${order.customer.firstName} ${order.customer.lastName},

Thank you for shopping with UFR Collection! Your order has been 
successfully placed and will be processed shortly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order.orderId}
Order Date: ${new Date().toLocaleDateString()}
Payment Method: ${order.paymentMethod.toUpperCase()}
Delivery Charges: ${order.deliveryCharges === 0 ? 'FREE' : 'PKR ' + order.deliveryCharges}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ ITEMS ORDERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ORDER SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: PKR ${order.subtotal}
Delivery: ${order.deliveryCharges === 0 ? 'FREE' : 'PKR ' + order.deliveryCharges}
Total Amount: PKR ${order.total}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 SHIPPING ADDRESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${order.customer.address}
${order.customer.city}, ${order.customer.province}
Phone: ${order.customer.phone}

${order.luckyDrawToken ? `
🎁 LUCKY DRAW TOKEN 🎁
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your Lucky Draw Token: ${order.luckyDrawToken}
This token is automatically entered into our next lucky draw.
Prizes include iPhone 17, Honda Civic, and Cash prizes!
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Track your order: https://ufrcollection.netlify.app/track-order
Contact Support: https://wa.me/923001234567

Thank you for choosing UFR Collection!
Where tradition meets contemporary luxury.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    // ✅ Sirf customer ko bhejein
    return await this.sendEmail(order.customer.email, `🛍️ Order Confirmed! #${order.orderId} - UFR Collection`, message);
  },

  // ✅ CUSTOMER ONLY - Order Status Update Email
  async sendStatusUpdate(order: any) {
    const statusMessages: Record<string, string> = {
      pending: 'Your order has been received and is awaiting confirmation.',
      confirmed: 'Your order has been confirmed and will be processed soon.',
      processing: 'Your order is being carefully packed and prepared for shipment.',
      shipped: 'Your order has been dispatched and is on its way to you!',
      delivered: 'Your order has been delivered. We hope you love your purchase!',
      cancelled: 'Your order has been cancelled as requested.'
    };
    
    const message = `
╔══════════════════════════════════════════════════════╗
║           UFR COLLECTION - ORDER STATUS UPDATE       ║
╚══════════════════════════════════════════════════════╝

Dear ${order.customer.firstName},

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ORDER STATUS UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order.orderId}
New Status: ${order.status.toUpperCase()}

${statusMessages[order.status] || 'Your order status has been updated.'}

${order.trackingNumber ? `📮 Tracking Number: ${order.trackingNumber}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Track your order: https://ufrcollection.netlify.app/track-order

Thank you for shopping with UFR Collection!
    `;
    
    // ✅ Sirf customer ko bhejein
    return await this.sendEmail(order.customer.email, `📦 Order Update #${order.orderId} - UFR Collection`, message);
  },

  // ✅ ADMIN ONLY - New Order Alert (Sirf Admin ko)
  async sendAdminOrderAlert(order: any) {
    const itemsList = order.items.map((item: any, idx: number) => 
      `${idx + 1}. ${item.name} | Size: ${item.size || 'OS'} | Color: ${item.color || 'Std'} | Qty: ${item.quantity} | Price: PKR ${item.price}`
    ).join('\n');
    
    const message = `
╔══════════════════════════════════════════════════════╗
║      🔔 NEW ORDER RECEIVED - UFR COLLECTION 🔔       ║
╚══════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ORDER INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order ID: ${order.orderId}
Order Date: ${new Date().toLocaleString()}
Status: ${order.status || 'PENDING'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 CUSTOMER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${order.customer.firstName} ${order.customer.lastName}
Email: ${order.customer.email}
Phone: ${order.customer.phone}
Address: ${order.customer.address}
City: ${order.customer.city}
Province: ${order.customer.province}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ ORDER ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: PKR ${order.subtotal}
Delivery: ${order.deliveryCharges === 0 ? 'FREE' : 'PKR ' + order.deliveryCharges}
Total Amount: PKR ${order.total}
Payment Method: ${order.paymentMethod?.toUpperCase()}
${order.trxId ? `Transaction ID: ${order.trxId}` : ''}

${order.luckyDrawToken ? `🎁 Lucky Draw Token Generated: ${order.luckyDrawToken}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Login to admin panel to update order status:
https://ufrcollection.netlify.app/admin/orders

✅ Verify payment (if JazzCash/EasyPaisa)
✅ Update order status
✅ Process shipment
    `;
    
    // ✅ Sirf admin ko bhejein
    return await this.sendEmail(ADMIN_EMAIL, `🔔 NEW ORDER #${order.orderId} - Action Required`, message);
  },

  // ✅ CUSTOMER ONLY - Welcome Email
  async sendWelcomeEmail(user: any) {
    const message = `
╔══════════════════════════════════════════════════════╗
║       WELCOME TO UFR COLLECTION - EXCLUSIVE CLUB     ║
╚══════════════════════════════════════════════════════╝

Dear ${user.displayName || user.email?.split('@')[0] || 'Valued Client'},

We are truly honored to welcome you to the UFR Collection family.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ EXCLUSIVE BENEFITS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Early access to seasonal collections
• Exclusive member-only offers
• Birthday special discounts
• First to know about lucky draws

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛍️ START SHOPPING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Explore our latest luxury collection:
https://ufrcollection.netlify.app/shop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 STAY CONNECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Follow us on social media for updates:
📷 Instagram: @ufrcollection
💬 WhatsApp Support: https://wa.me/923001234567

Welcome to luxury redefined.

With warmth,
UFR Collection Team
    `;
    
    // ✅ Sirf customer ko bhejein
    return await this.sendEmail(user.email, `✨ Welcome to UFR Collection, ${user.displayName || 'Valued Client'}!`, message);
  }
};