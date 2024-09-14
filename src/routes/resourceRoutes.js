const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createResource,
    updateResource,
    deleteResource,
    restoreResource,
    getAllResources,
    getResourceById,
    exportResources,
    importResources
} = require('../controllers/resourceControllers');

const router = express.Router();

router.post(
    '/add-resource',
    [
        check('name', 'Resource name is required').not().isEmpty(),
        check('unitPrice', 'Unit price is required').isNumeric(),
        check('location', 'Location is required').not().isEmpty(),
        check('currency', 'Currency is required').not().isEmpty(),
        check('level', 'Level is required').not().isEmpty()
    ],
    authenticateToken,
    createResource
);

router.post('/import-resources', authenticateToken, importResources);

router.put(
    '/:id',
    [
        check('name', 'Resource name is required').optional().not().isEmpty(),
        check('unitPrice', 'Unit price is required').optional().isNumeric(),
        check('location', 'Location is required').optional().not().isEmpty(),
        check('currency', 'Currency is required').optional().not().isEmpty(),
        check('level', 'Level is required').optional().not().isEmpty()
    ],
    authenticateToken,
    updateResource
);

router.delete('/:id', authenticateToken, deleteResource);
router.patch('/restore/:id', authenticateToken, restoreResource);

router.get('/get-all-resources', authenticateToken, getAllResources);

router.get('/export-resources', authenticateToken, exportResources);
router.get('/:id', authenticateToken, getResourceById);

module.exports = router;
