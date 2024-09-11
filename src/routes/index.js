const express = require('express');

const userRoutes = require('./userRoutes');
const divisionRoutes = require('./divisionRoutes');
const departmentRoutes = require('./departmentRoutes');
const assumptionRoutes = require('./assumptionRoutes');

const setRoutes = (app) => {
    app.use('/api/users', userRoutes);
    app.use('/api/division', divisionRoutes);
    app.use('/api/department', departmentRoutes);
    app.use('/api/assumption', assumptionRoutes);
};

module.exports = setRoutes;
