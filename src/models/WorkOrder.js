// models/WorkOrder.js
import mongoose from 'mongoose';

const workOrderSchema = new mongoose.Schema({
    workOrderId: Number,
    kaplanUnit: { type: String, required: true },
    description: String,
    priority: { type: String, enum: ['Critical', 'High', 'Normal', 'Low'] },
    priorityRank: Number,
    serviceType: String,
    serviceSubType: String,

    assignedTechnician: {
        name: String,
        technicianId: mongoose.Schema.Types.ObjectId // ref: 'User'
    },

    ticketIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
    ticketStatus: String,
    reason: String,

    totalLabourHours: Number,

    timeIn: Date,
    timeOut: Date,
    dropOffDate: Date,
    workStartDate: Date,
    partsOrderDate: Date,
    partsDeliveryDate: Date,
    repairCompletionDate: Date,

    complaint: String,
    cause: String,
    correction: String,

    billOfMaterials: [{
        partName: String,
        partNumber: String,
        quantity: Number
    }],

    attachments: [String], // S3 URLs

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('WorkOrder', workOrderSchema);
