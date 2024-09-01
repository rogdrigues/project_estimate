const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { addDepartment, updateDepartment, getDepartmentById, getAllDepartments, deleteDepartment } = require('../controllers/departmentControllers');

const router = express.Router();

router.post(
    '/add-department',
    [
        check('name', 'Department name is required').not().isEmpty(),
        check('code', 'Department code is required').not().isEmpty(),
        check('division', 'Division is required').not().isEmpty(),
        check('lead', 'Department lead is required').not().isEmpty()
    ],
    authenticateToken,
    addDepartment
);

router.put(
    '/:id',
    [
        check('name', 'Department name is required').not().isEmpty(),
        check('code', 'Department code is required').not().isEmpty(),
        check('division', 'Division is required').not().isEmpty(),
        check('lead', 'Department lead is required').not().isEmpty()
    ],
    authenticateToken,
    updateDepartment
);

router.delete('/:id', authenticateToken, deleteDepartment);

router.get('/get-all-department', authenticateToken, getAllDepartments);

router.get('/:id', authenticateToken, getDepartmentById);

module.exports = router;
