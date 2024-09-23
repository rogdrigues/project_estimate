const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authenticateToken = require('../middlewares/authenticateToken');
const { restorePresalePlan, deletePresalePlan, getPresalePlanById, getAllPresalePlans, updatePresalePlan, createPresalePlan } = require('../controllers/presalePlanControllers/presalePlanControllers');
const { createComment, getCommentsForPresalePlan, approvePresalePlan, rejectPresalePlan } = require('../controllers/presalePlanControllers/presalePlanCommentControllers');

// Routes for Presale Plans
router.post(
    '/create',
    authenticateToken,
    [
        check('opportunity').notEmpty().withMessage('Opportunity ID is required'),
        check('name').notEmpty().withMessage('Name is required'),
        check('department').notEmpty().withMessage('Department ID is required'),
        check('division').notEmpty().withMessage('Division ID is required')
    ],
    createPresalePlan
);

router.put(
    '/update/:id',
    authenticateToken,
    [
        check('name').optional().notEmpty().withMessage('Name cannot be empty'),
        check('description').optional().notEmpty().withMessage('Description cannot be empty')
    ],
    updatePresalePlan
);

router.get('/all', authenticateToken, getAllPresalePlans);

router.get('/:id', authenticateToken, getPresalePlanById);

router.delete('/delete/:id', authenticateToken, deletePresalePlan);

router.post('/restore/:id', authenticateToken, restorePresalePlan);

// Routes for Presale Plan Comments
router.post(
    '/comment',
    authenticateToken,
    [
        check('presalePlan').notEmpty().withMessage('Presale Plan ID is required'),
        check('comment').notEmpty().withMessage('Comment is required'),
        check('approvalStatus')
            .isIn(['Approved', 'Rejected', 'Pending'])
            .withMessage('Approval status must be Approved, Rejected, or Pending')
    ],
    createComment
);

router.get('/comments/:presalePlanId', authenticateToken, getCommentsForPresalePlan);

// Approve/Reject Presale Plan
router.post('/approve/:id', authenticateToken, approvePresalePlan);

router.post(
    '/reject/:id',
    authenticateToken,
    [check('reason').notEmpty().withMessage('Rejection reason is required')],
    rejectPresalePlan
);

module.exports = router;
