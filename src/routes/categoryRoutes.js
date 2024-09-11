const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { addCategory, updateCategory, deleteCategory, restoreCategory, getAllCategories, getCategoryById, exportCategories, importCategories } = require('../controllers/categoryControllers');

const router = express.Router();

router.post(
    '/add-category',
    [
        check('CategoryName', 'Category name is required').not().isEmpty()
    ],
    authenticateToken,
    addCategory
);

router.put(
    '/:id',
    [
        check('CategoryName', 'Category name is required').not().isEmpty()
    ],
    authenticateToken,
    updateCategory
);

router.delete('/:id', authenticateToken, deleteCategory);

router.get('/restore/:id', authenticateToken, restoreCategory);

router.get('/get-all-categories', authenticateToken, getAllCategories);

router.get('/export-categories', authenticateToken, exportCategories);

router.post('/import-categories', authenticateToken, importCategories);

router.get('/:id', authenticateToken, getCategoryById);

module.exports = router;
