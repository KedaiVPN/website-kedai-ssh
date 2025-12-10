const crypto = require('crypto');

const verifyDigiflazzWebhook = (req, res, next) => {
  const webhookSecret = process.env.DIGIFLAZZ_WEBHOOK_SECRET;

  // Jika secret tidak diatur di server, lewati validasi (untuk pengembangan)
  if (!webhookSecret) {
    console.warn('[WARN] DIGIFLAZZ_WEBHOOK_SECRET is not set. Skipping webhook signature verification.');
    return next();
  }

  const signature = req.headers['x-hub-signature'];
  if (!signature) {
    console.error('[ERROR] Digiflazz webhook: Missing x-hub-signature header.');
    return res.status(401).send('Signature header is missing.');
  }

  // Penting: Gunakan req.rawBody yang akan kita atur di server.js
  const rawBody = req.rawBody;
  if (!rawBody) {
      console.error('[ERROR] Digiflazz webhook: rawBody is not available. Ensure JSON parser with verify is used.');
      return res.status(500).send('Internal Server Error: Raw body not captured.');
  }

  const expectedSignature = 'sha1=' + crypto
    .createHmac('sha1', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.error('[ERROR] Digiflazz webhook: Invalid signature.');
    return res.status(403).send('Invalid signature.');
  }

  next();
};

module.exports = { verifyDigiflazzWebhook };
