const cron = require('node-cron');
const DigiflazzService = require('./digiflazzService');

let syncTask = null;
let transactionCheckTask = null;

const runSync = async () => {
  console.log(`[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })}] Running scheduled Digiflazz product sync...`);
  try {
    const result = await DigiflazzService.syncAllDigiflazzProducts();
    console.log(`[AutoSync] Sync finished. Games: ${result.results.game.new} new, ${result.results.game.updated} updated. Pulsa: ${result.results.pulsa.new} new, ${result.results.pulsa.updated} updated. Data: ${result.results.data.new} new, ${result.results.data.updated} updated.`);
    console.log(`[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })}] Scheduled sync finished successfully.`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })}] Error during scheduled Digiflazz sync:`, error.message);
  }
};

const runTransactionCheck = async () => {
  try {
    await DigiflazzService.checkPendingTransactions();
  } catch (error) {
    console.error(`[${new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })}] Error during scheduled transaction check:`, error.message);
  }
};

const scheduleSync = (intervalMinutes) => {
  // Hentikan task lama jika ada
  if (syncTask) {
    syncTask.stop();
  }

  // Buat cron expression dari interval
  const cronExpression = `*/${intervalMinutes} * * * *`;

  // Jadwalkan task baru
  syncTask = cron.schedule(cronExpression, runSync, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });

  console.log(`[AutoSync] Digiflazz product sync scheduled to run every ${intervalMinutes} minutes.`);
};

const startTransactionCheck = () => {
  if (transactionCheckTask) {
    transactionCheckTask.stop();
  }

  // Run every minute
  transactionCheckTask = cron.schedule('* * * * *', runTransactionCheck, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });

  console.log('[AutoSync] Digiflazz transaction check scheduled to run every minute.');
};

const stopSync = () => {
  if (syncTask) {
    syncTask.stop();
    syncTask = null;
    console.log('[AutoSync] Digiflazz auto-sync has been stopped.');
  }
};

const initializeAutoSync = async () => {
  try {
    // Start transaction check immediately
    startTransactionCheck();

    const settings = await DigiflazzService.getAutoSyncSettings();
    if (settings.is_active) {
      scheduleSync(settings.interval_minutes);
    } else {
      console.log('[AutoSync] Digiflazz auto-sync is disabled.');
    }
  } catch (error) {
    console.error('[AutoSync] Failed to initialize Digiflazz auto-sync:', error.message);
  }
};

module.exports = {
  initializeAutoSync,
  scheduleSync,
  stopSync,
};
