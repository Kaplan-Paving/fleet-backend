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
router.post('/', createReading);
router.get('/', getAllReadings);
router.get('/:kaplanUnitNo', getReadingsByKaplanUnit);

export default router;
