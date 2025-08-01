import mongoose from 'mongoose';
import clockSchema from './clockSchema.js'; // modularized clock schema

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    contactNo: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'mechanic', 'operator'],
    },
    // ✅ New field added here
    profilePicture: {
        type: String,
        default: 'https://placehold.co/400x400/EFEFEF/AAAAAA&text=No+Image' // Default placeholder image
    },
    payRate: { type: Number },
    // ✅ UPDATED: A more structured way to store permissions
    permissions: {
        type: Map,
        of: {
            view: { type: Boolean, default: false },
            edit: { type: Boolean, default: false }
        }
    },

    // Latest or active shift time (not daily)
    clockIn: { type: Date },   // When current or last shift started
    clockOut: { type: Date },  // When current or last shift ended

    // Historical logs (date-based)
    lastSeen: { type: Date },
    clockLogs: [clockSchema]
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);
