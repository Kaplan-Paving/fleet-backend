import express from 'express';
import {
    createAsset,
    getAllAssets,
    getAssetById,
    updateAsset,
    deleteAsset
} from '../controllers/assetController.js';
import { checkPermission } from '../middlewares/checkPermission.js';

const router = express.Router();

// Permissions required for each operation
router.post('/', createAsset);
router.get('/', getAllAssets);
router.get('/:id', checkPermission(['view_asset']), getAssetById);
router.put('/:id', checkPermission(['edit_asset']), updateAsset);
router.delete('/:id', checkPermission(['delete_asset']), deleteAsset);

export default router;
