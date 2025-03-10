require('dotenv').config();
require('module-alias/register');
const connectDB = require('./config/db');
const express = require('express');
const app = express();
const useMiddlewares = require('./middlewares/middleware');
const cron = require('node-cron');

// Call middleware.js
useMiddlewares(app, express);
// Seed data
const seedAllData = require('./seeder/index');
// Routes
const setRoutes = require('./routes/index');
// Controller
const { updateDivisionLeads } = require('./controllers/divisionControllers');
const { checkPendingStatus } = require('./services/cronJobs');

// Get the PORT from environment variables or default to 3000
const PORT = process.env.PORT || process.env.NODE_PORT;

// Await for mongoose connection
(async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Seeder Data with reset
        if (process.env.SEED_DATA_RESET === 'true') {
            await seedAllData();
        }

        // Set up routes
        setRoutes(app);

        // Schedule cron job
        cron.schedule('0 0 * * *', async () => {
            console.log('Running cron job to check Pending Status of Presale Plans');
            await checkPendingStatus();
        });

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}/`);
        });
    } catch (error) {
        console.log('MongoDB connection failed', error);
    }
})();
