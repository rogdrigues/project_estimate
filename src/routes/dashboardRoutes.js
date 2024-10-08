const express = require('express');
const { getOpportunityStatusSummary, getWeeklyChanges, getProjectStatusSummary, getTemplateStatusSummary } = require('../controllers/dashboardControllers');
const router = express.Router();

router.get('/summary', getWeeklyChanges);

router.get('/opportunity-status', getOpportunityStatusSummary);

router.get('/project-status', getProjectStatusSummary);

router.get('/template-status', getTemplateStatusSummary);


module.exports = router;
