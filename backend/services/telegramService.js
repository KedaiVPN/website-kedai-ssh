
const axios = require('axios');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.ownerId = process.env.TELEGRAM_OWNER_ID;
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  // Validate Telegram configuration
  static validateConfig() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      console.warn('[TelegramService] Missing Telegram configuration. Notifications disabled.');
      return false;
    }
    
    return true;
  }

  // Format date to yy-mm-dd
  formatDate(date = new Date()) {
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Send message to Telegram
  async sendMessage(message) {
    if (!TelegramService.validateConfig()) {
      return { success: false, error: 'Telegram not configured' };
    }

    try {
      console.log('[TelegramService] Sending notification to Telegram group');
      
      const response = await axios.post(`${this.baseURL}/sendMessage`, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      }, {
        timeout: 10000
      });

      console.log('[TelegramService] Notification sent successfully');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('[TelegramService] Failed to send notification:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Account creation notification
  async notifyAccountCreation(data) {
    const { username, serverName, protocol, userRole, accountName, duration, totalCost, userId } = data;
    
    const message = `──────────────────────
Create ${protocol} has been succesfully
──────────────────────
✧ Username : ${username}
✧ Role  : ${userRole}
✧ Remarks : ${accountName}
✧ Type  : ${protocol}
✧ Server : ${serverName}
✧ Exp   : ${duration} days
✧ Price : Rp${totalCost.toLocaleString('id-ID')}
✧ Date  : ${this.formatDate()}
──────────────────────`;

    return await this.sendMessage(message);
  }

  // XL package purchase notification
  async sendXLPurchaseNotification(data) {
    const { packageName, username, role, phoneNumber } = data;

    // Censor phone number
    const censoredNumber = phoneNumber.length > 7
      ? `${phoneNumber.substring(0, 4)}xxxxxxx${phoneNumber.slice(-2)}`
      : phoneNumber;

    const message = `━━━━━━━━━━━━━━━━━━━━
Dor paket has been successfully
━━━━━━━━━━━━━━━━━━━━
» Paket   : ${packageName}
» Client  : ${username}
» Role    : ${role}
» Number  : ${censoredNumber}
» Date    : ${this.formatDate()}
━━━━━━━━━━━━━━━━━━━━`;

    return await this.sendMessage(message);
  }

  // Top-up notification
  async notifyTopup(data) {
    const { username, userId, amount, transactionCode } = data;
    
    const message = `──────────────────────
Topup balance has been succesfully
──────────────────────
➥ Username: ${username}
➥ User ID: ${userId}
➥ Top-up: Rp${amount.toLocaleString('id-ID')}
➥ transaction code: ${transactionCode}
➥ Date: ${this.formatDate()}
──────────────────────`;

    return await this.sendMessage(message);
  }

  // Account renewal notification
  async notifyAccountRenewal(data) {
    const { username, userRole, accountName, serverName, protocol, duration } = data;
    
    const message = `──────────────────────
Renew ${protocol} has been succesfully
──────────────────────
🔹 username : ${username}
🔹 Role : ${userRole}
🔹 Remarks : ${accountName}
🔹 Server : ${serverName}
🔹 Protocol : ${protocol}
🔹 Extend : ${duration} days
──────────────────────`;

    return await this.sendMessage(message);
  }

  // Reseller upgrade notification
  async notifyResellerUpgrade(data) {
    const { username, userId, newRole } = data;
    
    const message = `──────────────────────
Change role has been succesfully
──────────────────────
➥ Username: ${username}
➥ User ID: ${userId}
➥ New role: ${newRole}
➥ Date: ${this.formatDate()}
──────────────────────`;

    return await this.sendMessage(message);
  }

  // Test connection
  async testConnection() {
    if (!TelegramService.validateConfig()) {
      return { success: false, error: 'Telegram not configured' };
    }

    const testMessage = `🤖 Test Notification - ${this.formatDate()}\nTelegram Bot berhasil terhubung!`;
    return await this.sendMessage(testMessage);
  }
}

module.exports = TelegramService;
