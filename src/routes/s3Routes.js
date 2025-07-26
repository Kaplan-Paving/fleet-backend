// src/routes/s3Routes.js
import express from 'express';
import { generateUploadUrl, generateDownloadUrl } from '../services/s3Service.js';

const router = express.Router();

// Request pre-signed upload URL
router.get('/upload-url', async (req, res) => {
    try {
        const { uploadUrl, fileKey } = await generateUploadUrl();
        res.json({ uploadUrl, fileKey });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

// Request pre-signed download URL
router.get('/download-url/:fileKey', async (req, res) => {
    try {
        const downloadUrl = await generateDownloadUrl(req.params.fileKey);
        res.json({ downloadUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate download URL' });
    }
});

export default router;
