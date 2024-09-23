const express = require('express');

const userRoutes = require('./userRoutes');
const divisionRoutes = require('./divisionRoutes');
const departmentRoutes = require('./departmentRoutes');
const assumptionRoutes = require('./assumptionRoutes');
const categoryRoutes = require('./categoryRoutes');
const resourceRoutes = require('./resourceRoutes');
const technologyRoutes = require('./technologyRoutes');
const productivityRoutes = require('./productivityRoutes');
const checklistRoutes = require('./checklistRoutes');
const presaleOpportunityRoutes = require('./presaleOpportunityRoutes');
const presalePlanRoutes = require('./presalePlanRoutes');

const setRoutes = (app) => {
    app.use('/api/users', userRoutes);
    app.use('/api/division', divisionRoutes);
    app.use('/api/department', departmentRoutes);
    app.use('/api/assumption', assumptionRoutes);
    app.use('/api/category', categoryRoutes);
    app.use('/api/resource', resourceRoutes);
    app.use('/api/technology', technologyRoutes);
    app.use('/api/productivity', productivityRoutes);
    app.use('/api/checklist', checklistRoutes);
    app.use('/api/opportunity', presaleOpportunityRoutes);
    app.use('/api/presalePlan', presalePlanRoutes);
};

module.exports = setRoutes;
