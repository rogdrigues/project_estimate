const express = require('express');
const router = express.Router();
const { check, body, param } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { restorePresalePlan, deletePresalePlan, getPresalePlanById, getAllPresalePlans, updatePresalePlan, createPresalePlan } = require('../controllers/presalePlanControllers/presalePlanControllers');
const { createComment, getCommentsForPresalePlan, approvePresalePlan, rejectPresalePlan } = require('../controllers/presalePlanControllers/presalePlanCommentControllers');
const { createPresalePlanVersion, getVersionsForPresalePlan, getPresalePlanVersionById, deletePresalePlanVersion } = require('../controllers/presalePlanControllers/presalePlanVersionControllers');

// Routes for Presale Plans
router.post(
    '/create-presale-plan',
    authenticateToken,
    [
        check('opportunity').notEmpty().withMessage('Opportunity ID is required'),
        check('name').notEmpty().withMessage('Name is required'),
        check('division').notEmpty().withMessage('Division ID is required')
    ],
    createPresalePlan
);

router.put(
    '/update-presale/:id',
    authenticateToken,
    [
        check('name').optional().notEmpty().withMessage('Name cannot be empty'),
        check('description').optional().notEmpty().withMessage('Description cannot be empty')
    ],
    updatePresalePlan
);

router.get('/get-all-presale', authenticateToken, getAllPresalePlans);

router.get('/presale-plan/:id', authenticateToken, getPresalePlanById);

router.delete('/delete-presale/:id', authenticateToken, deletePresalePlan);

router.post('/restore-presale/:id', authenticateToken, restorePresalePlan);

// Routes for Presale Plan Comments
router.post(
    '/create-presale-comment',
    authenticateToken,
    [
        check('presalePlan').notEmpty().withMessage('Presale Plan is required'),
        check('comment').notEmpty().withMessage('Comment is required'),
        check('approvalStatus')
            .isIn(['Approved', 'Rejected', 'Pending'])
            .withMessage('Approval status must be Approved, Rejected, or Pending')
    ],
    createComment
);

router.get('/comments/:presalePlanId', authenticateToken, getCommentsForPresalePlan);

// Approve/Reject Presale Plan
router.post('/approve-comment/:id', authenticateToken, approvePresalePlan);

router.post(
    '/reject-comment/:id',
    authenticateToken,
    [check('reason').notEmpty().withMessage('Rejection reason is required')],
    rejectPresalePlan
);

//Presale plan version
router.post(
    '/version/create-presale-version',
    authenticateToken,
    [
        body('presalePlan').notEmpty().withMessage('Presale Plan is required'),
        body('versionNumber').isNumeric().withMessage('Version number must be a number'),
        body('changes').notEmpty().withMessage('Changes description is required')
    ],
    createPresalePlanVersion
);

router.get(
    '/versions/list-presale-version/:presalePlanId',
    authenticateToken,
    getVersionsForPresalePlan
);

router.get(
    '/version/get-presale-version/:versionId',
    authenticateToken,
    getPresalePlanVersionById
);

router.delete(
    '/version/delete/:versionId',
    authenticateToken,
    deletePresalePlanVersion
);

module.exports = router;
