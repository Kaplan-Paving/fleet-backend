import Asset from '../models/Asset.js';
import RepairTicket from '../models/RepairTicket.js';
import WorkOrder from '../models/WorkOrder.js';
import Reading from '../models/Reading.js';
import AuditTrail from '../models/AuditTrail.js';
import User from '../models/User.js';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
/**
 * @desc    Get statistics about users (total and active)
 * @route   GET /api/dashboard/user-stats
 * @access  Private
 */
export const getUserStats = async (req, res) => {
    try {
        // Get the total count of all users in the database
        const totalUsers = await User.countDocuments();

        // Define "active" as having been seen in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Count users whose 'lastSeen' timestamp is more recent than 5 minutes ago
        const activeUsers = await User.countDocuments({
            lastSeen: { $gte: fiveMinutesAgo }
        });

        // Send the stats back as a JSON object
        res.status(200).json({
            totalUsers,
            activeUsers
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};





export const getDashboardStats = async (req, res) => {
    try {
        // Fleet stats
        const totalFleet = await Asset.countDocuments();
        const activeUnits = await Asset.countDocuments({ status: 'Active' });
        const outOfServiceUnits = await Asset.countDocuments({ status: 'Out of Service' });

        // Repair ticket stats
        const totalTickets = await RepairTicket.countDocuments();
        const normalTickets = await RepairTicket.countDocuments({ priority: 'Normal' });
        const highTickets = await RepairTicket.countDocuments({ priority: 'High' });
        const criticalTickets = await RepairTicket.countDocuments({ priority: 'Critical' });

        return res.status(200).json({
            fleetStats: {
                totalFleet,
                activeUnits,
                outOfServiceUnits
            },
            ticketStats: {
                totalTickets,
                normalTickets,
                highTickets,
                criticalTickets
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ message: 'Server error while fetching dashboard stats.' });
    }
};




export const getTopAssetsByRepairs = async (req, res) => {
    try {
        // Step 1: Group by kaplanUnitNo and count repairs
        const repairCounts = await RepairTicket.aggregate([
            {
                $group: {
                    _id: '$kaplanUnitNo',
                    totalRepairs: { $sum: 1 },
                    lastRepairDate: { $max: '$date' }
                }
            },
            { $sort: { totalRepairs: -1 } },
            { $limit: 5 }
        ]);

        // Step 2: Enrich each unit with asset and average resolve time
        const topAssets = await Promise.all(repairCounts.map(async item => {
            const asset = await Asset.findOne({ kaplanUnitNo: item._id });

            if (!asset) return null;

            const workOrders = await WorkOrder.find({
                kaplanUnit: item._id,
                timeIn: { $ne: null },
                timeOut: { $ne: null }
            });

            const avgResolveTime =
                workOrders.length > 0
                    ? (workOrders.reduce((sum, w) => sum + ((w.timeOut - w.timeIn) / (1000 * 60 * 60)), 0) / workOrders.length).toFixed(1)
                    : 'N/A';

            return {
                kaplanUnitNo: item._id,
                assetType: asset.assetType || 'N/A',
                subAssetType: asset.subAssetType || 'N/A',
                model: asset.model || 'N/A',
                totalRepairs: item.totalRepairs,
                lastRepair: item.lastRepairDate,
                avgResolveTime: avgResolveTime + ' hrs'
            };
        }));

        return res.status(200).json({
            topAssetsByRepairs: topAssets.filter(Boolean)
        });

    } catch (error) {
        console.error('Top assets by repair frequency error:', error);
        return res.status(500).json({ message: 'Failed to get top assets by repair frequency' });
    }
};



/**
 * @desc    Get top 10 fuel inefficient units
 * @route   GET /api/dashboard/fuel-inefficient
 * @access  Private
 */
export const getTopFuelInefficientUnits = async (req, res) => {
    try {
        // Helper function within the aggregation to safely parse numbers from strings like "200 Gallons"
        const safeNumericConversion = (field) => ({
            $let: {
                vars: {
                    // Find the first sequence of digits (and optional decimal point) in the string
                    numericPart: { $regexFind: { input: { $toString: field }, regex: /[\d.]+/ } }
                },
                // Convert the matched part to a double, or return 0 if no number was found
                in: { $toDouble: { $ifNull: ["$$numericPart.match", "0"] } }
            }
        });

        // Step 1: Aggregate latest readings and calculate MPG/GPH safely
        const latestReadings = await Reading.aggregate([
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: "$kaplanUnitNo",
                    latestReading: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$latestReading" } },
            {
                $project: {
                    kaplanUnitNo: 1,
                    assetClass: 1,
                    // ✅ FIX: Use the safe conversion for all numeric fields
                    mpg: {
                        $cond: [
                            { $gt: [safeNumericConversion("$fuelUpdate"), 0] },
                            { $divide: [safeNumericConversion("$odometer"), safeNumericConversion("$fuelUpdate")] },
                            null
                        ]
                    },
                    gph: {
                        $cond: [
                            { $gt: [safeNumericConversion("$hours"), 0] },
                            { $divide: [safeNumericConversion("$fuelUpdate"), safeNumericConversion("$hours")] },
                            null
                        ]
                    }
                }
            },
            { $sort: { mpg: 1 } }, // Sort by lowest MPG to find most inefficient
            { $limit: 10 }
        ]);

        // Step 2: Calculate fleet-wide averages safely
        const fleetAvg = await Reading.aggregate([
            {
                $project: {
                    // ✅ FIX: Use the safe conversion here as well
                    mpg: {
                        $cond: [
                            { $gt: [safeNumericConversion("$fuelUpdate"), 0] },
                            { $divide: [safeNumericConversion("$odometer"), safeNumericConversion("$fuelUpdate")] },
                            null
                        ]
                    },
                    gph: {
                        $cond: [
                            { $gt: [safeNumericConversion("$hours"), 0] },
                            { $divide: [safeNumericConversion("$fuelUpdate"), safeNumericConversion("$hours")] },
                            null
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgMPG: { $avg: "$mpg" },
                    avgGPH: { $avg: "$gph" }
                }
            }
        ]);

        const avgFleet = fleetAvg[0] || { avgMPG: 0, avgGPH: 0 };

        // Step 3: Enrich with asset data and format for frontend
        const topInefficientUnits = await Promise.all(latestReadings.map(async (item) => {
            const asset = await Asset.findOne({ kaplanUnitNo: item.kaplanUnitNo }).select('assetType subAssetType');
            return {
                kaplanUnit: item.kaplanUnitNo,
                assetType: asset?.assetType || 'N/A',
                subType: asset?.subAssetType || 'N/A',
                mpg: Number(item.mpg?.toFixed(2)) || 0,
                gph: Number(item.gph?.toFixed(2)) || 0,
                avgFleetMPG: Number(avgFleet.avgMPG?.toFixed(2)) || 0,
                avgFleetGPH: Number(avgFleet.avgGPH?.toFixed(2)) || 0,
            };
        }));

        res.status(200).json(topInefficientUnits);

    } catch (error) {
        console.error("Fuel Inefficiency Error:", error);
        res.status(500).json({ error: "Failed to fetch fuel inefficient units" });
    }
};

import moment from 'moment';

export const getDashboardNotifications = async (req, res) => {
    try {
        // Get the 10 most recent audit logs
        const logs = await AuditTrail.find({})
            .sort({ timestamp: -1 })
            .limit(10);

        // Format response
        const notifications = logs.map(log => {
            let title = '';
            let message = '';
            let timeAgo = moment(log.timestamp).fromNow();

            // Customize titles based on `action` or `entity`
            if (log.entity === 'RepairTicket' && log.action === 'create') {
                title = 'Submitted repair ticket';
                message = `${log.description}`;
            } else if (log.entity === 'Reading') {
                title = 'Meter Reading';
                message = `${log.description}`;
            } else if (log.entity === 'AlertThreshold') {
                title = 'Threshold Alert';
                message = `${log.description}`;
            } else {
                title = log.action;
                message = log.description;
            }

            return {
                title,
                message,
                timeAgo,
            };
        });

        res.json({ success: true, notifications });
    } catch (err) {
        console.error('Error fetching dashboard notifications:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};


/**
 * @desc    Get lifecycle data (repair frequency, costs) for a specific asset
 * @route   GET /api/dashboard/fleet-lifecycle?kaplanUnitNo=...
 * @access  Private
 */
export const getFleetLifecycleData = async (req, res) => {
    try {
        const { kaplanUnitNo } = req.query;
        if (!kaplanUnitNo) {
            return res.status(400).json({ message: 'Kaplan Unit Number is required.' });
        }

        // --- Chart Data: Repair Frequency ---
        // Find all tickets for the unit with status "Ready to Deploy" in the last 12 months
        const twelveMonthsAgo = subMonths(new Date(), 12);
        const tickets = await RepairTicket.find({
            kaplanUnitNo,
            ticketStatus: 'Ready to Deploy',
            createdAt: { $gte: twelveMonthsAgo }
        });

        // Group the tickets by month
        const monthlyData = {};
        for (let i = 0; i < 12; i++) {
            const monthName = format(subMonths(new Date(), i), 'MMM');
            monthlyData[monthName] = 0;
        }

        tickets.forEach(ticket => {
            const monthName = format(new Date(ticket.createdAt), 'MMM');
            if (monthlyData.hasOwnProperty(monthName)) {
                monthlyData[monthName]++;
            }
        });

        const chartData = Object.entries(monthlyData).map(([name, value]) => ({ name, value })).reverse();

        // --- Stat Card Data ---
        // In a real app, this would be a complex calculation. We'll use mock/simple data for now.
        const asset = await Asset.findOne({ kaplanUnitNo });
        const totalAssetValue = asset ? asset.purchaseAmount : 0;
        const totalRepairCost = 2562; // Placeholder: This would be calculated from related work orders

        res.status(200).json({
            chartData,
            totalAssetValue,
            totalRepairCost
        });

    } catch (error) {
        console.error('Error fetching fleet lifecycle data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};



/**
 * @desc    Get an overview of tickets by a specific priority
 * @route   GET /api/dashboard/ticket-overview?priority=...
 * @access  Private
 */
export const getTicketOverview = async (req, res) => {
    try {
        const { priority } = req.query;

        if (!priority) {
            return res.status(400).json({ message: 'Priority is required.' });
        }

        // Find the top 5 tickets matching the specified priority, sorted by the newest first
        const tickets = await RepairTicket.find({ priority })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('ticketNumber issueDescription'); // Only select the fields we need

        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching ticket overview:', error);
        res.status(500).json({ message: 'Server Error' });
    }
}
