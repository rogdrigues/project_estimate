const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    addAssumption,
    updateAssumption,
    deleteAssumption,
    restoreAssumption,
    getAllAssumptions,
    getAssumptionById,
    exportAssumptions,
    importAssumptions
} = require('../controllers/assumptionControllers');
const upload = require('../middlewares/cloudinaryUpload');

const router = express.Router();

router.post(
    '/add-assumption',
    [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
        check('category', 'Category is required').not().isEmpty()
    ],
    authenticateToken,
    addAssumption
);

router.put(
    '/update-assumption/:id',
    [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
        check('category', 'Category is required').not().isEmpty()
    ],
    authenticateToken,
    updateAssumption
);

router.delete('/:id', authenticateToken, deleteAssumption);

router.patch('/restore/:id', authenticateToken, restoreAssumption);

router.get('/get-all-assumptions', authenticateToken, getAllAssumptions);

router.get('/export-assumptions', authenticateToken, exportAssumptions);

router.post('/import-assumptions', authenticateToken, upload.single('file'), importAssumptions);

router.get('/:id', authenticateToken, getAssumptionById);

module.exports = router;
