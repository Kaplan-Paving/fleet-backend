import Asset from '../models/Asset.js';
import RepairTicket from '../models/RepairTicket.js';
import WorkOrder from '../models/WorkOrder.js';
import Reading from '../models/Reading.js';
import AuditTrail from '../models/AuditTrail.js';

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


export const getTopFuelInefficientUnits = async (req, res) => {
    try {
        // Get latest reading per Kaplan Unit
        const latestReadings = await Reading.aggregate([
            {
                $sort: { date: -1 }
            },
            {
                $group: {
                    _id: "$kaplanUnitNo",
                    latestReading: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$latestReading" }
            },
            {
                $project: {
                    kaplanUnitNo: 1,
                    assetClass: 1,
                    mpg: {
                        $cond: [
                            { $gt: ["$fuelUpdate", 0] },
                            { $divide: ["$odometer", "$fuelUpdate"] },
                            null
                        ]
                    },
                    gph: {
                        $cond: [
                            { $gt: ["$hours", 0] },
                            { $divide: ["$fuelUpdate", "$hours"] },
                            null
                        ]
                    }
                }
            },
            {
                $sort: { mpg: 1 } // ascending order => lowest MPG
            },
            { $limit: 10 }
        ]);

        // Calculate fleet-wide averages
        const fleetAvg = await Reading.aggregate([
            {
                $project: {
                    mpg: {
                        $cond: [
                            { $gt: ["$fuelUpdate", 0] },
                            { $divide: ["$odometer", "$fuelUpdate"] },
                            null
                        ]
                    },
                    gph: {
                        $cond: [
                            { $gt: ["$hours", 0] },
                            { $divide: ["$fuelUpdate", "$hours"] },
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

        const formatted = latestReadings.map(item => ({
            kaplanUnitNo: item.kaplanUnitNo,
            assetType: item.assetClass,
            subType: item.subType || '', // if stored elsewhere, adjust
            mpg: Number(item.mpg?.toFixed(2)) || 0,
            gph: Number(item.gph?.toFixed(2)) || 0,
            avgFleetMPG: Number(avgFleet.avgMPG?.toFixed(2)) || 0,
            avgFleetGPH: Number(avgFleet.avgGPH?.toFixed(2)) || 0,
        }));

        res.status(200).json({ topFuelInefficientUnits: formatted });

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