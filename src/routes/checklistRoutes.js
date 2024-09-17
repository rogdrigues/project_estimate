const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createChecklist,
    updateChecklist,
    getAllChecklists,
    getChecklistById,
    deleteChecklist,
    restoreChecklist,
    exportChecklists,
    importChecklists
} = require('../controllers/checklistControllers');

const router = express.Router();

router.post(
    '/create',
    [
        check('name', 'Checklist name is required').not().isEmpty(),
        check('category', 'Checklist category is required').not().isEmpty()
    ],
    authenticateToken,
    createChecklist
);

router.put(
    '/:id',
    [
        check('name', 'Checklist name is required').not().isEmpty(),
        check('category', 'Checklist category is required').not().isEmpty()
    ],
    authenticateToken,
    updateChecklist
);

router.get('/get-all', authenticateToken, getAllChecklists);

router.delete('/:id', authenticateToken, deleteChecklist);

router.patch('/restore/:id', authenticateToken, restoreChecklist);

router.get('/export', authenticateToken, exportChecklists);

router.post('/import', authenticateToken, importChecklists);

router.get('/:id', authenticateToken, getChecklistById);

module.exports = router;
