const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { addDepartment, updateDepartment, getDepartmentById, getAllDepartments, deleteDepartment, restoreDepartment, exportDepartments, importDepartments, getDepartmentLeads } = require('../controllers/departmentControllers');
const upload = require('../middlewares/cloudinaryUpload');
const router = express.Router();

router.post(
    '/add-department',
    upload.single('logo'),
    [
        check('name', 'Department name is required').not().isEmpty(),
        check('division', 'Division is required').not().isEmpty(),
        check('lead', 'Department lead is required').not().isEmpty()
    ],
    authenticateToken,
    addDepartment
);

router.post('/import-departments', authenticateToken, importDepartments);

router.put(
    '/:id',
    upload.single('logo'),
    [
        check('name', 'Department name is required').not().isEmpty(),
        check('division', 'Division is required').not().isEmpty(),
        check('lead', 'Department lead is required').not().isEmpty()
    ],
    authenticateToken,
    updateDepartment
);

router.put('/restore/:id', authenticateToken, restoreDepartment);

router.delete('/:id', authenticateToken, deleteDepartment);

router.get('/export-departments', authenticateToken, exportDepartments);

router.get('/get-all-department', authenticateToken, getAllDepartments);

router.get('/department-leads', authenticateToken, getDepartmentLeads);

router.get('/:id', authenticateToken, getDepartmentById);

module.exports = router;
