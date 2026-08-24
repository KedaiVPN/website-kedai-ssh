const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const { generateConfigFile } = require('../utils/generator.cjs');
const { waitUntilReady } = require('../utils/hc.cjs');

router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { accountId, templateId, appType } = req.body;

        if (!accountId || !templateId || !appType) {
            return res.status(400).json({ success: false, message: 'Missing required parameters.' });
        }

        // Wait for libsodium to be ready
        await waitUntilReady();

        // 1. Fetch VPN Account
        const [accRows] = await pool.query(`
            SELECT va.*, s.domain as server_domain, s.ip_server as ip_server
            FROM vpn_account va
            LEFT JOIN Server s ON va.server_id = s.id
            WHERE va.id = ? AND va.user_id = ?`,
            [accountId, userId]
        );
        if (accRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Account not found or access denied.' });
        }
        const account = accRows[0];

        // 2. Fetch Template
        const [tempRows] = await pool.query('SELECT * FROM bug_hosts WHERE id = ?', [templateId]);
        if (tempRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Template not found.' });
        }
        const template = tempRows[0];

        // 3. Prepare parameters for generator
        let sshAccount, uriData;

        if (account.protocol === 'ssh') {
            const host = account.server_domain || account.ip_server;
            const port = account.ssh_ws_port || 80;
            sshAccount = `${host}:${port}@${account.username}:${account.password}`;
        } else {
            // Xray (vmess, vless, trojan)
            if (account.protocol === 'vmess') uriData = account.vmess_tls_link || account.vmess_nontls_link;
            else if (account.protocol === 'vless') uriData = account.vless_tls_link || account.vless_nontls_link;
            else if (account.protocol === 'trojan') uriData = account.trojan_tls_link || account.trojan_nontls_link1;

            if (!uriData) {
                 return res.status(400).json({ success: false, message: 'No valid URI found for this account.' });
            }
        }

        // 4. Generate File
        const result = await generateConfigFile({
            template,
            sshAccount,
            uriData,
            appType
        });

        // 5. Stream file and delete
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.download(result.filePath, result.fileName, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file.' });
                }
            }
            // Cleanup temp file
            if (fs.existsSync(result.filePath)) {
                fs.unlinkSync(result.filePath);
            }
        });

    } catch (error) {
        console.error('Generate Config Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
});

module.exports = router;
