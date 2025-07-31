import Asset from '../models/Asset.js';
import Reading from '../models/Reading.js';
import Alert from '../models/Alert.js';
import MaintenanceThreshold from '../models/MaintenanceThreshold.js';

export const createReading = async (req, res) => {
    try {
        const { kaplanUnitNo, hours, odometer, fuelUpdate, user, date, statusUpdate } = req.body;

        // Check if the Asset exists
        const asset = await Asset.findOne({ kaplanUnitNo });
        if (!asset) {
            return res.status(404).json({ error: `Asset with Kaplan Unit #${kaplanUnitNo} does not exist.` });
        }

        const newReadingData = new Reading({
            kaplanUnitNo,
            hours,
            odometer,
            fuelUpdate,
            user,
            date,
            statusUpdate,
            assetClass: asset.assetType
        });

        // Save the new reading
        const savedReading = await newReadingData.save();

        // ✅ FIX: Re-fetch the document after saving to ensure it's a clean object
        const reading = await Reading.findById(savedReading._id);

        // Update latest odometer/hour reading in asset
        if (odometer || hours) {
            asset.latestOdometerHourReading = `${odometer || 'N/A'} mi / ${hours || 'N/A'} hr`;
            await asset.save();
        }

        // Get thresholds by subAssetType
        const { subAssetType } = asset;
        const threshold = await MaintenanceThreshold.findOne({ subAssetType });

        const alerts = [];

        if (threshold) {
            const extractNumber = (str) => {
                const match = str ? String(str).match(/[\d.]+/) : null;
                return match ? parseFloat(match[0]) : 0;
            };

            const engineThreshold = extractNumber(threshold.engineThreshold);
            const milesThreshold = threshold.milesThreshold;
            const gphThreshold = threshold.gph;

            if (hours && hours >= engineThreshold) {
                alerts.push({ type: 'Engine_threshold', level: 'Normal' });
            }

            if (odometer && parseInt(odometer) >= milesThreshold) {
                alerts.push({ type: 'Miles_threshold', level: 'High' });
            }

            if (fuelUpdate && hours) {
                const gphActual = parseFloat(fuelUpdate) / (parseFloat(hours) || 1);
                if (gphActual >= gphThreshold) {
                    alerts.push({ type: 'GPH_threshold', level: 'Critical' });
                }
            }
        }

        // Create alerts if any
        for (const alert of alerts) {
            await Alert.create({
                kaplanUnitNo,
                assetClass: asset.subAssetType,
                alertType: alert.type,
                alertLevel: alert.level,
            });
        }

        res.status(201).json({ reading, alertsTriggered: alerts.length, alerts });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


export const getReadingsByKaplanUnit = async (req, res) => {
    try {
        const readings = await Reading.find({ kaplanUnitNo: req.params.kaplanUnitNo });
        res.json(readings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAllReadings = async (req, res) => {
    try {
        const readings = await Reading.find();
        res.json(readings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
