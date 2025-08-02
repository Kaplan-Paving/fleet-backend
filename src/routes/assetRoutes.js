import express from 'express';
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset
} from '../controllers/assetController.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { protect } from '../middlewares/auth.js';
import { checkEditPermission } from '../middlewares/checkEditPermission.js';

const router = express.Router();

// Permissions required for each operation
router.post('/', protect, checkEditPermission('Fleet Assets'), createAsset);
router.get('/', protect, getAllAssets);
router.get('/:id', protect, getAssetById);
router.put('/:id', protect, checkEditPermission('Fleet Assets'), updateAsset);
router.delete('/:id', protect, checkEditPermission('Fleet Assets'), deleteAsset);

export default router;
