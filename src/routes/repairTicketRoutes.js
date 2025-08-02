import express from 'express';
import multer from 'multer';
import {
    createRepairTicket,
    getAllRepairTickets,
    deleteRepairTicket,
    updateTicketRanks // 1. Import the new controller
    // ... import your other controllers
} from '../controllers/repairTicketController.js';
import { protect } from '../middlewares/auth.js';
import { searchTickets, updateTicketStatus /*, other controllers */ } from '../controllers/repairTicketController.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';


const router = express.Router();
const upload = multer();

// ... (your existing POST, GET, DELETE routes)
router.post('/', upload.array('attachments', 5), createRepairTicket);
router.get('/', protect, getAllRepairTickets);
router.delete('/:id', protect, deleteRepairTicket);
router.get('/search', protect, searchTickets);
router.put('/:id/status', protect, updateTicketStatus);

// 2. Add the new route for updating ranks
router.put('/ranks', protect, updateTicketRanks);


export default router;
