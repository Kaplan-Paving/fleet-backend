import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.js';
import assetRoutes from './src/routes/assetRoutes.js';
import readingRoutes from './src/routes/readingRoutes.js';
import maintenanceThresholdRoutes from './src/routes/maintenanceThresholdRoutes.js'
import alertRoutes from './src/routes/alertRoutes.js'
import repairTicketRoutes from './src/routes/repairTicketRoutes.js';
import s3Routes from './src/routes/s3Routes.js';
import workOrderRoutes from './src/routes/workOrderRoutes.js';
import mechanicWorkLogRoutes from './src/routes/mechanicWorkLogRoutes.js';
import { requestLogger } from './src//middlewares/auditTrailLogger.js';
import { errorLogger } from './src/middlewares/errorHandler.js';
import auditTrailRoutes from './src/routes/auditTrailRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import mechanicRoutes from './src/routes/mechanicRoutes.js';
import { protect } from './src/middlewares/auth.js';
import { updateLastSeen } from './src/middlewares/activityTracker.js';
dotenv.config();

const app = express();
app.use(express.json());
const allowedOrigins = [
    'https://fleet.kaplanpaving.com', // Your production frontend
    'http://localhost:5173'           // Your local development frontend (adjust port if needed)
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
};


app.use(cors(corsOptions));

app.use(cookieParser());
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected'));

app.use(requestLogger);

app.use('/api', protect, updateLastSeen);
app.use('/apiv1/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/maintenanceThreshold', maintenanceThresholdRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/repair-tickets', repairTicketRoutes);
app.use('/api/s3', s3Routes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/worklogs', mechanicWorkLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-trail', auditTrailRoutes);
app.use('/api/mechanics', mechanicRoutes);

app.use(errorLogger);

app.get('/', (req, res) => {
    res.send('Welcome to the Kaplan Fleet Management');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));