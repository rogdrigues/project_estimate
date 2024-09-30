const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { createProject, updateProject, deleteProject, restoreProject, getAllProjects, updateProjectComponents, getProjectComponents } = require('../controllers/project/projectControllers');
const { approveProject, getCommentsByProject, deleteComment, updateComment, addComment, rejectProject } = require('../controllers/project/projectCommentController');

// Routes for project management
router.post(
    '/create',
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
    '/list',
    authenticateToken,
    getAllProjects
);

router.put(
    '/update-components/:id',
    authenticateToken,
    updateProjectComponents
);

router.get(
    '/components/:projectId',
    authenticateToken,
    getProjectComponents
);

// Routes for project comments
router.post(
    '/comments/add',
    [
        check('projectId', 'Project ID is required').not().isEmpty(),
        check('comment', 'Comment content is required').not().isEmpty(),
        check('action', 'Action type is required').not().isEmpty(),
    ],
    authenticateToken,
    addComment
);

router.put(
    '/comments/update/:id',
    authenticateToken,
    updateComment
);

router.delete(
    '/comments/delete/:id',
    authenticateToken,
    deleteComment
);

router.get(
    '/comments/project/:projectId',
    authenticateToken,
    getCommentsByProject
);

// Routes for approving or rejecting a project
router.post(
    '/approve/:projectId',
    authenticateToken,
    approveProject
);

router.post(
    '/reject/:projectId',
    authenticateToken,
    rejectProject
);

module.exports = router;
