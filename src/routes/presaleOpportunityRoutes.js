const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authenticateToken');
const { authorize } = require('../middlewares/authorize');
const { check } = require('express-validator');
const {
    createOpportunity,
    updateOpportunity,
    getAllOpportunities,
    getOpportunityById,
    deleteOpportunity,
    restoreOpportunity,
    getOpportunityLead,
    updateApprovalStatus,
    updateOpportunityAfterRejection,
    getLatestOpportunityVersion,
    getApprovedOpportunities
} = require('../controllers/presaleOpportunityControllers');

router.post('/create', authenticateToken, [
    check('name').notEmpty().withMessage('Name is required'),
    check('customerName').notEmpty().withMessage('Customer name is required'),
    check('timeline').isDate().withMessage('Valid timeline is required'),
    check('opportunityLead').notEmpty().withMessage('Opportunity Lead is required')
], createOpportunity);

router.put('/update/:id', authenticateToken, [
    check('name').optional().notEmpty(),
    check('customerName').optional().notEmpty(),
    check('timeline').optional().isDate(),
    check('opportunityLead').optional().notEmpty()
], updateOpportunity);

router.get('/list', authenticateToken, getAllOpportunities);

router.get('/opportunity-leads', authenticateToken, getOpportunityLead);

router.get('/:opportunityId/latest-version', authenticateToken, getLatestOpportunityVersion);

router.get('/list-approved', authenticateToken, getAllOpportunities);

router.get('/:id', authenticateToken, getApprovedOpportunities);

router.delete('/delete/:id', authenticateToken, deleteOpportunity);

router.put('/restore/:id', authenticateToken, restoreOpportunity);

router.put('/approve/:id', authenticateToken, updateApprovalStatus);

router.put('/update-rejection/:id', authenticateToken, updateOpportunityAfterRejection);

module.exports = router;
