const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/video/:file_id', async (req, res) => {
    const { file_id } = req.params;
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'Telegram bot token not configured on the server.' });
    }

    if (!file_id) {
        return res.status(400).json({ error: 'File ID is required.' });
    }

    try {
        // Step 1: Get the file_path from Telegram
        const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${file_id}`;
        const fileInfoResponse = await axios.get(getFileUrl);

        if (!fileInfoResponse.data.ok) {
            return res.status(404).json({ error: 'File not found on Telegram.', details: fileInfoResponse.data.description });
        }

        const filePath = fileInfoResponse.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

        // Step 2: Stream the video from Telegram to the client, forwarding the Range header
        const videoResponse = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream',
            headers: {
                'Range': req.headers.range
            },
            // Ensure axios does not throw an error for a 206 Partial Content status
            validateStatus: (status) => status >= 200 && status < 300,
        });

        // Forward the status code from Telegram's response (e.g., 200 for full content, 206 for partial)
        res.status(videoResponse.status);

        // Forward length and range headers from Telegram's response for seeking
        if (videoResponse.headers['content-length']) {
            res.setHeader('Content-Length', videoResponse.headers['content-length']);
        }
        if (videoResponse.headers['content-range']) {
            res.setHeader('Content-Range', videoResponse.headers['content-range']);
        }

        // --- KEY FIXES ---
        // Set a safe Content-Type to ensure it's treated as a video.
        res.setHeader('Content-Type', 'video/mp4');
        // Set Content-Disposition to 'inline' to instruct the browser to play the media, not download it.
        // This overrides any 'attachment' disposition from the source.
        res.setHeader('Content-Disposition', 'inline');
        // Always tell the browser we accept range requests, crucial for seeking.
        res.setHeader('Accept-Ranges', 'bytes');

        // Pipe the video stream from Telegram directly to the client response
        videoResponse.data.pipe(res);

    } catch (error) {
        console.error('Proxy error:', error.message);
        if (error.response) {
             return res.status(error.response.status).json({ error: 'Failed to fetch video from Telegram.', details: error.response.data });
        }
        res.status(500).json({ error: 'Internal server error while processing the video.' });
    }
});

module.exports = router;