import express from 'express';
import {
    createReading,
    getReadingsByKaplanUnit,
    getAllReadings
} from '../controllers/readingController.js';
import { checkPermission } from '../middlewares/checkPermission.js';

const router = express.Router();

// You can restrict with permissions if needed
router.post('/', checkPermission(['create_reading']), createReading);
router.get('/', checkPermission(['view_reading']), getAllReadings);
router.get('/:kaplanUnitNo', checkPermission(['view_reading']), getReadingsByKaplanUnit);

export default router;
