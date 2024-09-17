const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createProductivity,
    updateProductivity,
    getAllProductivities,
    getProductivityById,
    deleteProductivity,
    restoreProductivity,
    exportProductivities,
    importProductivities
} = require('../controllers/productivityControllers');

const router = express.Router();

router.post(
    '/add-productivity',
    [
        check('productivity', 'Productivity is required').not().isEmpty(),
        check('technology', 'Technology is required').not().isEmpty(),
        check('norm', 'Norm is required').not().isEmpty(),
        check('unit', 'Unit is required').not().isEmpty()
    ],
    authenticateToken,
    createProductivity
);

router.put(
    '/:id',
    [
        check('productivity', 'Productivity is required').not().isEmpty(),
        check('technology', 'Technology is required').not().isEmpty(),
        check('norm', 'Norm is required').not().isEmpty(),
        check('unit', 'Unit is required').not().isEmpty()
    ],
    authenticateToken,
    updateProductivity
);

router.delete('/:id', authenticateToken, deleteProductivity);
router.post('/:id/restore', authenticateToken, restoreProductivity);
router.post('/import', authenticateToken, importProductivities);
router.get('/get-all-productivities', authenticateToken, getAllProductivities);
router.get('/export', authenticateToken, exportProductivities);
router.get('/:id', authenticateToken, getProductivityById);

module.exports = router;
