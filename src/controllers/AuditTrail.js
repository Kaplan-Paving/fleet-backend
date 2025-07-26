// models/AuditTrail.js
import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
    user: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: String,
    },
    action: String,
    entity: String,
    description: String,
    dataSnapshot: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('AuditTrail', auditTrailSchema);
