// middlewares/errorHandler.js
import AuditTrail from '../models/AuditTrail.js';

export const errorLogger = async (err, req, res, next) => {
    console.error('❌ ERROR:', err);

    try {
        await AuditTrail.create({
            user: {
                id: req.user?._id || null,
                role: req.user?.role || 'Unknown'
            },
            action: 'ERROR_THROWN',
            entity: req.originalUrl,
            description: err.message,
            dataSnapshot: {
                stack: err.stack,
                method: req.method,
                path: req.originalUrl
            }
        });
    } catch (e) {
        console.error('Failed to log error to audit trail:', e.message);
    }

    res.status(500).json({ error: 'Internal Server Error' });
};
