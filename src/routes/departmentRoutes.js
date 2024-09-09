const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { addDepartment, updateDepartment, getDepartmentById, getAllDepartments, deleteDepartment, restoreDepartment } = require('../controllers/departmentControllers');
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

router.delete('/:id', authenticateToken, deleteDepartment);
router.put('/restore/:id', authenticateToken, restoreDepartment);

router.get('/get-all-department', authenticateToken, getAllDepartments);

router.get('/:id', authenticateToken, getDepartmentById);

module.exports = router;
