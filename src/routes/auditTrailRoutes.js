// routes/auditTrailRoutes.js
import express from 'express';
import AuditTrail from '../models/AuditTrail.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

// GET /api/audit-trail?user=xyz&limit=20
router.get('/', protect, async (req, res) => {
    try {
        const filter = {};
        if (req.query.user) {
            filter['user.id'] = req.query.user;
        }
        const logs = await AuditTrail.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(req.query.limit) || 50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

export default router;
