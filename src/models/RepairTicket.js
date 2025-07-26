import mongoose from 'mongoose';

const repairTicketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true
    },
    priorityRank: {
        type: Number,
        required: true
    },
    kaplanUnitNo: {
        type: String,
        required: true
    },
    issueDescription: {
        type: String,
        required: true
    },
    ticketStatus: {
        type: String,
        enum: [
            'Under Diagnosis',
            'Opened And Diagnosed',
            'Researching Parts',
            'Being Fixed',
            'Parts Ordered',
            'Ready to Deploy'
        ],
        default: 'Under Diagnosis'
    },
    reason: {
        type: String,
        required: true
    },
    attachments: [
        {
            url: String,
            key: String,
            originalName: String,
            mimetype: String,
            size: Number
        }
    ],
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    priority: {
        type: String,
        enum: ['Normal', 'High', 'Critical'],
        required: true,
        default: 'Normal'
    }
}, { timestamps: true });

export default mongoose.model('RepairTicket', repairTicketSchema);
