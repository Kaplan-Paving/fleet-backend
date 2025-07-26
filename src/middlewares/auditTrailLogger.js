// middlewares/auditTrailLogger.js
import AuditTrail from '../models/AuditTrail.js';

export const requestLogger = async (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', async () => {
        try {
            const endTime = Date.now();
            const duration = endTime - startTime;

            await AuditTrail.create({
                user: {
                    id: req.user?._id || null,
                    role: req.user?.role || 'Guest'
                },
                action: `${req.method}_${req.originalUrl}`,
                entity: req.originalUrl,
                description: `Endpoint hit: ${req.method} ${req.originalUrl}`,
                dataSnapshot: {
                    body: req.body,
                    query: req.query,
                    params: req.params,
                    statusCode: res.statusCode,
                    responseTimeMs: duration
                }
            });
        } catch (err) {
            console.error('AuditTrail log error:', err.message);
        }
    });

    next();
};
