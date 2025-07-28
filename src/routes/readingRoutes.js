import express from 'express';
import {
    createReading,
    getReadingsByKaplanUnit,
    getAllReadings
} from '../controllers/readingController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
const router = express.Router();

// You can restrict with permissions if needed
router.post('/', protect, checkPermission(['create_reading']), createReading);
router.get('/', protect, checkPermission(['view_reading']), getAllReadings);
router.get('/:kaplanUnitNo', protect, checkPermission(['view_reading']), getReadingsByKaplanUnit);

export default router;
