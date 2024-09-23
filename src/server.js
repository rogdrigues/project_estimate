require('dotenv').config();
const connectDB = require('./config/db');
const express = require('express');
const app = express();
const useMiddlewares = require('./middlewares/middleware');
const cron = require('node-cron');
const cronJob = require('cron').CronJob;
// Call middleware.js
useMiddlewares(app, express);
//Seed data
const seedAllData = require('./seeder/index');
//Routes
const setRoutes = require('./routes/index');
//Controller
const { updateDivisionLeads } = require('./controllers/divisionControllers');
const { checkPendingStatus } = require('./services/cronJobs');

//await for mongoose connection
(async () => {
    try {
        //Connect to MongoDB
        await connectDB();
        //Seeder Data 
        await seedAllData();
        //Routes
        setRoutes(app);
        cron.schedule('0 0 * * *', async () => {
            console.log('Running cron job to check Pending Status of Presale Plans');
            await checkPendingStatus();
        });
        app.listen(process.env.NODE_PORT, () => {
            console.log(`Server running at http://${process.env.MONGO_HOST}:${process.env.NODE_PORT}/`);
        })
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})()
