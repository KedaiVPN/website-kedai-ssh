const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateVerificationToken() {
    return uuidv4();
  }

  async sendVerificationCode(email, code, username) {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verifikasi Akun Kedai SSH - Kode Verifikasi',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .verification-code { background: #e3f2fd; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Kedai SSH</h1>
              <h2>Verifikasi Akun Anda</h2>
            </div>
            <div class="content">
              <h3>Halo ${username}!</h3>
              <p>Terima kasih telah mendaftar di Kedai SSH. Untuk menyelesaikan proses registrasi, silakan verifikasi alamat email Anda dengan memasukkan kode berikut:</p>
              
              <div class="verification-code">
                <p><strong>Kode Verifikasi:</strong></p>
                <div class="code">${code}</div>
              </div>

              <p><strong>Petunjuk:</strong></p>
              <ol>
                <li>Buka halaman verifikasi di Kedai SSH</li>
                <li>Masukkan kode 6 digit di atas</li>
                <li>Klik tombol "Verifikasi"</li>
              </ol>

              <p><strong>Penting:</strong></p>
              <ul>
                <li>Kode ini berlaku selama 24 jam</li>
                <li>Jangan bagikan kode ini kepada siapapun</li>
                <li>Jika Anda tidak merasa mendaftar, abaikan email ini</li>
              </ul>

              <div class="footer">
                <p>Jika Anda mengalami kesulitan, silakan hubungi admin.</p>
                <p><strong>Kedai SSH</strong></p>
                <p style="font-size: 12px; color: #999;">Email ini dikirim otomatis, mohon jangan membalas.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Verification code email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('Error sending verification code email:', error);
      return false;
    }
  }

  async sendGoogleVerificationLink(email, token, username) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${token}&type=google`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verifikasi Akun Google - Kedai SSH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 15px 30px; background: #4285f4; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Kedai SSH</h1>
              <h2>Verifikasi Akun Google</h2>
            </div>
            <div class="content">
              <h3>Halo ${username}!</h3>
              <p>Terima kasih telah bergabung dengan kami. Untuk keamanan akun Anda, silakan verifikasi alamat email ini dengan mengklik tombol di bawah:</p>
              
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">✅ Verifikasi Email Saya</a>
              </div>

              <p><strong>Atau salin link berikut ke browser Anda:</strong></p>
              <p style="background: #e3f2fd; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${verificationLink}</p>

              <p><strong>Penting:</strong></p>
              <ul>
                <li>Link ini berlaku selama 24 jam</li>
                <li>Setelah verifikasi, Anda dapat menggunakan semua fitur Kedai SSH</li>
                <li>Jika Anda tidak merasa login, abaikan email ini</li>
              </ul>

              <div class="footer">
                <p>Jika Anda mengalami kesulitan, silakan hubungi admin.</p>
                <p><strong>Kedai SSH</strong></p>
                <p style="font-size: 12px; color: #999;">Email ini dikirim otomatis, mohon jangan membalas.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Google verification link email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('Error sending Google verification email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email, token, username) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Reset Password - Kedai SSH',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 15px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Kedai SSH</h1>
              <h2>Reset Password</h2>
            </div>
            <div class="content">
              <h3>Halo ${username}!</h3>
              <p>Kami menerima permintaan untuk reset password akun Kedai SSH Anda. Jika Anda yang melakukan permintaan ini, silakan klik tombol di bawah:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">🔑 Reset Password</a>
              </div>

              <p><strong>Atau salin link berikut ke browser Anda:</strong></p>
              <p style="background: #e3f2fd; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${resetLink}</p>

              <div class="warning">
                <p><strong>⚠️ Penting:</strong></p>
                <ul>
                  <li>Link ini berlaku selama 1 jam</li>
                  <li>Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini</li>
                  <li>Untuk keamanan, jangan bagikan link ini kepada siapapun</li>
                </ul>
              </div>

              <div class="footer">
                <p>Jika Anda mengalami kesulitan, silakan hubungi admin.</p>
                <p><strong>Kedai SSH</strong></p>
                <p style="font-size: 12px; color: #999;">Email ini dikirim otomatis, mohon jangan membalas.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully to:', email);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
