const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const doService = require('../services/digitalOceanService');

const handleServiceError = (res, error, defaultMessage) => {
    console.error(defaultMessage, error.message);
    const message = error.response?.data?.message || error.message || defaultMessage;
    res.status(500).json({ error: message });
};

// Get all API keys
router.get('/keys', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, is_active, created_at FROM digitalocean_apikeys ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        handleServiceError(res, err, 'Failed to fetch API keys');
    }
});

// Add a new API key
router.post('/keys', async (req, res) => {
    const { name, api_key } = req.body;
    if (!name || !api_key) {
        return res.status(400).json({ error: 'Name and API key are required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO digitalocean_apikeys (name, api_key) VALUES (?, ?)', [name, api_key]);
        res.status(201).json({ id: result.insertId, name, is_active: 1 });
    } catch (err) {
        handleServiceError(res, err, 'Failed to add API key');
    }
});

// Delete an API key
router.delete('/keys/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'API key ID is required' });
    try {
        await pool.query('DELETE FROM digitalocean_apikeys WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        handleServiceError(res, err, 'Failed to delete API key');
    }
});

// Get account info
router.get('/account/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const accountInfo = await doService.getAccountInfo(apiKey);
        res.json(accountInfo);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get account info');
    }
});

// Get balance info
router.get('/balance/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const balanceInfo = await doService.getBalanceInfo(apiKey);
        res.json(balanceInfo);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get balance info');
    }
});

// Get droplets
router.get('/droplets/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const droplets = await doService.getDroplets(apiKey);
        res.json(droplets);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get droplets');
    }
});

// Get regions
router.get('/regions/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const regions = await doService.getRegions(apiKey);
        res.json(regions);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get regions');
    }
});

// Get sizes
router.get('/sizes/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const sizes = await doService.getSizes(apiKey);
        res.json(sizes);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get sizes');
    }
});

// Get images
router.get('/images/:keyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const images = await doService.getImages(apiKey);
        res.json(images);
    } catch (err) {
        handleServiceError(res, err, 'Failed to get images');
    }
});


// Create droplet
router.post('/droplets/:keyId', async (req, res) => {
    const { name, region, size, image, ssh_keys } = req.body;
    if (!name || !region || !size || !image || !ssh_keys || !Array.isArray(ssh_keys) || ssh_keys.length === 0) {
        return res.status(400).json({ error: 'Name, region, size, image, and at least one SSH key are required.' });
    }
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);

        // Translate local SSH key IDs to DigitalOcean IDs
        const localKeyIds = ssh_keys;
        const [rows] = await pool.query('SELECT digitalocean_id FROM digitalocean_sshkeys WHERE id IN (?) AND api_key_id = ?', [localKeyIds, req.params.keyId]);

        if (rows.length !== localKeyIds.length) {
            return res.status(400).json({ error: 'One or more SSH keys are invalid or not found.' });
        }

        const digitaloceanKeyIds = rows.map(row => row.digitalocean_id);

        const dropletRequest = {
            name,
            region,
            size,
            image,
            ssh_keys: digitaloceanKeyIds
        };

        const droplet = await doService.createDroplet(apiKey, dropletRequest);
        res.status(201).json(droplet);
    } catch (err) {
        handleServiceError(res, err, 'Failed to create droplet');
    }
});

// Delete droplet
router.delete('/droplets/:keyId/:dropletId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        await doService.deleteDroplet(apiKey, req.params.dropletId);
        res.json({ success: true });
    } catch (err) {
        handleServiceError(res, err, 'Failed to delete droplet');
    }
});

// Get local SSH keys
router.get('/sshkeys/:keyId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, fingerprint, digitalocean_id FROM digitalocean_sshkeys WHERE api_key_id = ?', [req.params.keyId]);
        res.json(rows);
    } catch (err) {
        handleServiceError(res, err, 'Failed to fetch SSH keys');
    }
});

// Add SSH key
router.post('/sshkeys/:keyId', async (req, res) => {
    const { name, public_key } = req.body;
    if (!name || !public_key) {
        return res.status(400).json({ error: 'Name and public key are required.' });
    }
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const doSshKey = await doService.addSshKey(apiKey, name, public_key);

        await pool.query(
            'INSERT INTO digitalocean_sshkeys (name, fingerprint, public_key, digitalocean_id, api_key_id) VALUES (?, ?, ?, ?, ?)',
            [doSshKey.ssh_key.name, doSshKey.ssh_key.fingerprint, doSshKey.ssh_key.public_key, doSshKey.ssh_key.id, req.params.keyId]
        );
        res.status(201).json(doSshKey.ssh_key);
    } catch (err) {
        handleServiceError(res, err, 'Failed to add SSH key');
    }
});

// Delete SSH key
router.delete('/sshkeys/:keyId/:sshKeyId', async (req, res) => {
    try {
        const apiKey = await doService.getApiKey(req.params.keyId);
        const [rows] = await pool.query('SELECT digitalocean_id FROM digitalocean_sshkeys WHERE id = ?', [req.params.sshKeyId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'SSH key not found in local DB.' });
        }
        const doKeyId = rows[0].digitalocean_id;

        await doService.deleteSshKey(apiKey, doKeyId);
        await pool.query('DELETE FROM digitalocean_sshkeys WHERE id = ?', [req.params.sshKeyId]);

        res.json({ success: true });
    } catch (err) {
        handleServiceError(res, err, 'Failed to delete SSH key');
    }
});

module.exports = router;
