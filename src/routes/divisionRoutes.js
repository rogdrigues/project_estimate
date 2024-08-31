const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { addDivision, updateDivision, deleteDivision, getAllDivisions, getDivisionById } = require('../controllers/divisionControllers');

const router = express.Router();

router.post(
    '/add',
    [
        check('name', 'Division name is required').not().isEmpty(),
        check('code', 'Division code is required').not().isEmpty(),
        check('lead', 'Division lead is required').not().isEmpty()
    ],
    authenticateToken,
    addDivision
);

router.put(
    '/update/:id',
    [
        check('name', 'Division name is required').not().isEmpty(),
        check('code', 'Division code is required').not().isEmpty(),
        check('lead', 'Division lead is required').not().isEmpty()
    ],
    authenticateToken,
    updateDivision
);

router.delete('/delete/:id', authenticateToken, deleteDivision);

router.get('/get-all-division', authenticateToken, getAllDivisions);

router.get('/:id', authenticateToken, getDivisionById);

module.exports = router;
