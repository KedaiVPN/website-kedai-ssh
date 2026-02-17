const ping = require('ping');
const NodeCache = require('node-cache');
const pool = require('../db/connection');

// Cache with 11 minutes TTL (to cover the 10-minute interval + buffer)
const pingCache = new NodeCache({ stdTTL: 660, checkperiod: 120 });
let isJobRunning = false;

// Helper function to limit concurrency
async function pMap(array, mapper, concurrency) {
  const results = [];
  const iterator = array.entries();
  const workers = new Array(concurrency).fill(iterator).map(async (iterator) => {
    for (const [index, item] of iterator) {
      try {
        results[index] = await mapper(item, index);
      } catch (e) {
        console.error(`Error processing item ${index}:`, e);
        results[index] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function pingServer(domain) {
  try {
    const result = await ping.promise.probe(domain, {
      timeout: 5,
      extra: ['-c', '3']
    });

    const pingValue = result.alive ? Math.round(result.time) : 999;

    if (!result.alive) {
        console.warn(`[Ping Warning] ${domain} is not alive. Output: ${result.output}`);
    }

    return pingValue;
  } catch (error) {
    console.error(`Ping error for ${domain}:`, error);
    return 999;
  }
}

async function updateServerStatus() {
  if (isJobRunning) {
      console.log('Server status update job is already running, skipping...');
      return;
  }
  isJobRunning = true;
  console.log(`[${new Date().toISOString()}] Starting server status update job...`);

  try {
    const query = `SELECT id, domain FROM Server WHERE status IN ('online', 'offline', 'maintenance', 'full')`;
    const [rows] = await pool.query(query);

    // Process servers with limited concurrency (5 at a time)
    await pMap(rows, async (row) => {
      const currentPing = await pingServer(row.domain);
      pingCache.set(row.domain, currentPing);
    }, 5);

    console.log(`[${new Date().toISOString()}] Server status update job completed. Cache updated for ${rows.length} servers.`);
  } catch (error) {
    console.error('Error updating server status:', error);
  } finally {
    isJobRunning = false;
  }
}

function startServerStatusJob() {
  // Run immediately on startup
  updateServerStatus();

  // Schedule every 10 minutes (600,000 ms)
  setInterval(updateServerStatus, 600000);
}

function getPing(domain) {
    // If cache miss, return null (or could trigger a background update, but let's stick to the scheduled job)
    // Or return 999 if strictly relied on job? Let's return undefined if not found so the route can decide.
    // However, to be safe, if cache is empty (e.g. startup), maybe trigger a single ping?
    // For now, let's return the cached value or a default 'Pending...' or 0/999?
    // Let's return undefined if not found.
    return pingCache.get(domain);
}

module.exports = {
  startServerStatusJob,
  getPing
};
