import Asset from '../models/Asset.js';
import Reading from '../models/Reading.js';
import Alert from '../models/Alert.js';
import MaintenanceThreshold from '../models/MaintenanceThreshold.js';

export const createReading = async (req, res) => {
    try {
        const { kaplanUnitNo, hours, odometer, fuelUpdate } = req.body;

        // ✅ Check if the Asset exists
        const asset = await Asset.findOne({ kaplanUnitNo });
        if (!asset) {
            return res.status(400).json({ error: `Asset with Kaplan Unit #${kaplanUnitNo} does not exist.` });
        }

        // ✅ Save reading
        const reading = new Reading(req.body);
        await reading.save();

        // ✅ Update latest odometer/hour reading in asset
        const latest = `${odometer} mi / ${hours} hr`;
        asset.latestOdometerHourReading = latest;
        await asset.save();

        // ✅ Get thresholds by subAssetType
        const { subAssetType } = asset;
        const threshold = await MaintenanceThreshold.findOne({ subAssetType });

        const alerts = [];

        if (threshold) {
            // Extract number from strings like "30 Hr." or "6 months"
            const extractNumber = (str) => {
                const match = str.match(/[\d.]+/);
                return match ? parseFloat(match[0]) : 0;
            };

            const engineThreshold = extractNumber(threshold.engineThreshold);
            const milesThreshold = threshold.milesThreshold;
            const gphThreshold = threshold.gph;

            if (hours >= engineThreshold) {
                alerts.push({ type: 'Engine_threshold', level: 'Normal' });
            }

            if (parseInt(odometer) >= milesThreshold) {
                alerts.push({ type: 'Miles_threshold', level: 'High' });
            }

            const gphActual = parseFloat(fuelUpdate) / (parseFloat(hours) || 1);
            if (gphActual >= gphThreshold) {
                alerts.push({ type: 'GPH_threshold', level: 'Critical' });
            }
        }

        // ✅ Create alerts if any
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
