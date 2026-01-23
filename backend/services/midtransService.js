const midtransClient = require('midtrans-client');
const pool = require('../db/connection');

class MidtransService {
  static getConfig() {
    return {
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    };
  }

  static getSnapClient() {
    const config = this.getConfig();
    return new midtransClient.Snap({
      isProduction: config.isProduction,
      serverKey: config.serverKey
    });
  }

  static getCoreApiClient() {
    const config = this.getConfig();
    return new midtransClient.CoreApi({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey
    });
  }

  static async createSnapTransaction(params) {
    const snap = this.getSnapClient();

    // params should include: order_id, gross_amount, customer_details, etc.
    const transactionDetails = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone
      },
      item_details: params.itemDetails, // Optional
      expiry: {
        unit: 'days',
        duration: 1
      }
    };

    try {
      const transaction = await snap.createTransaction(transactionDetails);
      // transaction contains .token and .redirect_url
      return transaction;
    } catch (error) {
      console.error('Midtrans Create Transaction Error:', error);
      throw error;
    }
  }

  static async handleNotification(notificationJson) {
    const apiClient = this.getCoreApiClient();
    try {
      const statusResponse = await apiClient.transaction.notification(notificationJson);
      return statusResponse;
    } catch (error) {
      console.error('Midtrans Notification Error:', error);
      throw error;
    }
  }

  static mapStatusToInternal(midtransStatus, fraudStatus) {
    // Challenge status handling
    if (midtransStatus == 'capture') {
        if (fraudStatus == 'challenge') {
            return 'pending'; // or 'challenge'
        }
        return 'success';
    } else if (midtransStatus == 'settlement') {
        return 'success';
    } else if (midtransStatus == 'deny') {
        return 'failed';
    } else if (midtransStatus == 'cancel' || midtransStatus == 'expire') {
        return 'failed'; // or 'expired'
    } else if (midtransStatus == 'pending') {
        return 'pending';
    }
    return 'pending';
  }
}

module.exports = MidtransService;
