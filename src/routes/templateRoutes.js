const express = require('express');
const authenticateToken = require('../middlewares/authenticateToken');
const {
    createTemplate,
    updateTemplate,
    deleteTemplate,
    restoreTemplate,
    getAllTemplates,
    getTemplateById,
    getPublishedTemplatesForProject,
    downloadTemplateSample,
    downloadTemplate
} = require('../controllers/templateControllers');
const uploadTemplate = require('../middlewares/multer');

const router = express.Router();

router.post(
    '/create-template',
    uploadTemplate.single('file'),
    authenticateToken,
    createTemplate
);

router.put(
    '/update-template/:id',
    uploadTemplate.single('file'),
    authenticateToken,
    updateTemplate
);

router.delete('/delete-template/:id', authenticateToken, deleteTemplate);

router.patch('/restore-template/:id', authenticateToken, restoreTemplate);

router.get('/get-all-templates', authenticateToken, getAllTemplates);

router.get('/get-template/:id', authenticateToken, getTemplateById);

router.get('/get-published-templates-for-project', authenticateToken, getPublishedTemplatesForProject);

router.get('/download-template-sample', authenticateToken, downloadTemplateSample);

router.get('/download-template/:templateId', authenticateToken, downloadTemplate);

module.exports = router;
