const express = require('express');
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    restoreTemplate,
    getAllTemplates,
    getTemplateById,
    getPublishedTemplatesForProject,
    downloadTemplateSample
} = require('../controllers/templateControllers');

const router = express.Router();

router.post(
    '/create-template',
    [
        check('name', 'Template name is required').not().isEmpty(),
        check('filePath', 'File path is required').not().isEmpty(),
        check('createdBy', 'Created by is required').not().isEmpty()
    ],
    authenticateToken,
    createTemplate
);

router.put(
    '/update-template/:id',
    [
        check('name', 'Template name is required').not().isEmpty(),
        check('filePath', 'File path is required').not().isEmpty()
    ],
    authenticateToken,
    updateTemplate
);

router.delete('/delete-template/:id', authenticateToken, deleteTemplate);

router.patch('/restore-template/:id', authenticateToken, restoreTemplate);

router.get('/get-all-templates', authenticateToken, getAllTemplates);

router.get('/get-template/:id', authenticateToken, getTemplateById);

router.get('/get-published-templates-for-project', authenticateToken, getPublishedTemplatesForProject);

router.get('/download-template-sample', authenticateToken, downloadTemplateSample);

module.exports = router;
