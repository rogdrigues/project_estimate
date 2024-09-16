const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createTechnology,
    updateTechnology,
    getAllTechnologies,
    getTechnologyById,
    deleteTechnology,
    restoreTechnology,
    exportTechnologies,
    importTechnologies
} = require('../controllers/technologyControllers');

const router = express.Router();

router.post(
    '/add-technology',
    [
        check('name', 'Technology name is required').not().isEmpty(),
        check('version', 'Version is required').not().isEmpty(),
    ],
    authenticateToken,
    createTechnology
);

router.put(
    '/:id',
    [
        check('name', 'Technology name is required').not().isEmpty(),
        check('version', 'Version is required').not().isEmpty(),
    ],
    authenticateToken,
    updateTechnology
);

router.delete('/:id', authenticateToken, deleteTechnology);

router.patch('/restore/:id', authenticateToken, restoreTechnology);

router.get('/get-all-technologies', authenticateToken, getAllTechnologies);

router.get('/export-technologies', authenticateToken, exportTechnologies);

router.post('/import-technologies', authenticateToken, importTechnologies);

router.get('/:id', authenticateToken, getTechnologyById);

module.exports = router;
