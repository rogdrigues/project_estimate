const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { createProject, updateProject, deleteProject, restoreProject, getAllProjects, updateProjectComponents, getProjectComponents, getReviewers, updateProjectAssumption, updateProjectChecklist, updateProjectProductivity, updateProjectTechnology, updateProjectResource, getProjectById, getTemplateDataById } = require('../controllers/project/projectControllers');
const { approveProject, getCommentsByProject, deleteComment, updateComment, addComment, rejectProject, startReviewProcess, requestReview } = require('../controllers/project/projectCommentController');

// Routes for project management
router.post(
    '/create-project',
    [
        check('name', 'Project name is required').not().isEmpty(),
        check('category', 'Project category is required').not().isEmpty(),
        check('opportunity', 'Opportunity ID is required').not().isEmpty(),
        check('template', 'Template ID is required').not().isEmpty(),
    ],
    authenticateToken,
    createProject
);

router.put(
    '/update/:id',
    [
        check('name', 'Project name is required').not().isEmpty(),
        check('category', 'Project category is required').not().isEmpty(),
        check('opportunity', 'Opportunity ID is required').not().isEmpty(),
        check('template', 'Template ID is required').not().isEmpty(),
    ],
    authenticateToken,
    updateProject
);

router.delete(
    '/delete/:id',
    authenticateToken,
    deleteProject
);

router.put(
    '/restore/:id',
    authenticateToken,
    restoreProject
);

router.get(
    '/list-all-project',
    authenticateToken,
    getAllProjects
);

router.get(
    '/get-project/:projectId',
    authenticateToken,
    getProjectById
)

router.put(
    '/update-components/:id',
    authenticateToken,
    updateProjectComponents
);

router.get(
    '/list-components/:projectId',
    authenticateToken,
    getProjectComponents
);

router.get(
    '/list-reviewers',
    authenticateToken,
    getReviewers
)

router.get('/template-data', authenticateToken, getTemplateDataById);

//for updated project components after being selected
router.put(
    '/update-assumption/:id',
    [
        check('title', 'Title is required').not().isEmpty(),
        check('content', 'Content is required').not().isEmpty(),
        check('category', 'Category is required').not().isEmpty()
    ],
    authenticateToken,
    updateProjectAssumption
);

router.put(
    '/update-checklist/:id',
    [
        check('name', 'Checklist name is required').not().isEmpty(),
        check('category', 'Checklist category is required').not().isEmpty()
    ],
    authenticateToken,
    updateProjectChecklist
);

router.put(
    '/update-productivity/:id',
    [
        check('productivity', 'Productivity is required').not().isEmpty(),
        check('technology', 'Technology is required').not().isEmpty(),
        check('norm', 'Norm is required').not().isEmpty(),
        check('unit', 'Unit is required').not().isEmpty()
    ],
    authenticateToken,
    updateProjectProductivity
);

router.put(
    '/update-technology/:id',
    [
        check('name', 'Technology name is required').not().isEmpty(),
        check('category', 'Category is required').not().isEmpty(),
    ],
    authenticateToken,
    updateProjectTechnology
);

router.put(
    '/update-resource/:id',
    [
        check('name', 'Resource name is required').optional().not().isEmpty(),
        check('unitPrice', 'Unit price is required').optional().isNumeric(),
        check('location', 'Location is required').optional().not().isEmpty(),
        check('currency', 'Currency is required').optional().not().isEmpty(),
        check('level', 'Level is required').optional().not().isEmpty()
    ],
    authenticateToken,
    updateProjectResource
);
// Project comment routes
router.post(
    '/comments/add/:projectId',
    [
        check('comment', 'Comment content is required').not().isEmpty(),
        check('action', 'Action type is required').not().isEmpty(),
        check('decision', 'Decision is required if action is Approval or Rejected').optional(),
    ],
    authenticateToken,
    addComment
);

router.put(
    '/comments/update/:id',
    [
        check('comment', 'Updated comment is required').not().isEmpty(),
    ],
    authenticateToken,
    updateComment
);

router.delete(
    '/comments/delete/:id',
    authenticateToken,
    deleteComment
);

router.get(
    '/comments/list/:projectId',
    authenticateToken,
    getCommentsByProject
);

router.post(
    '/comments/start-review/:projectId',
    authenticateToken,
    startReviewProcess
);

router.post(
    '/comments/request-review/:projectId',
    authenticateToken,
    requestReview
);

module.exports = router;
