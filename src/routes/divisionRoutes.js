const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const upload = require('../middlewares/cloudinaryUpload');
const {
    addDivision,
    updateDivision,
    deleteDivision,
    getAllDivisions,
    getDivisionById,
    exportDivisions,
    importDivisions,
    restoreDivision,
    getDivisionLeads
} = require('../controllers/divisionControllers');
const router = express.Router();

router.post(
    '/add-division',
    [
        check('name', 'Division name is required').not().isEmpty(),
        check('lead', 'Division lead is required').not().isEmpty()
    ],
    authenticateToken,
    upload.single('logo'),
    addDivision
);

router.post('/import-divisions', authenticateToken, importDivisions);

router.put(
    '/:id',
    [
        check('name', 'Division name is required').not().isEmpty(),
        check('lead', 'Division lead is required').not().isEmpty()
    ],
    authenticateToken,
    upload.single('logo'),
    updateDivision
);

router.put('/restore/:id', authenticateToken, restoreDivision);

router.delete('/:id', authenticateToken, deleteDivision);

router.get('/get-all-divisions', authenticateToken, getAllDivisions);

router.get('/export-divisions', authenticateToken, exportDivisions);

router.get('/division-leads', authenticateToken, getDivisionLeads);

router.get('/:id', authenticateToken, getDivisionById);

module.exports = router;
