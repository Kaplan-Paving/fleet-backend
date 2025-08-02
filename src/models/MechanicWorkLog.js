import mongoose from 'mongoose';

// Updated to include vendor and price, matching the modal's UI
const partSchema = new mongoose.Schema({
    partName: { type: String, required: true },
    partNumber: String,
    vendorName: String,
    price: Number,
    quantity: { type: Number, default: 1 }
}, { _id: false });

const mechanicWorkLogSchema = new mongoose.Schema({
    mechanic: {
        name: { type: String, required: true },      // denormalized
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    kaplanUnitNo: { type: String, required: true },
    workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
    date: { type: Date, required: true },
    timeIn: { type: Date },
    timeOut: { type: Date },

    laborHours: {
        type: Number
    },
    partsUsed: [partSchema],
    resolutionNote: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('MechanicWorkLog', mechanicWorkLogSchema);
