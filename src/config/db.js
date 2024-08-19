const mongoose = require('mongoose');

const dbState = [
    {
        state: 0,
        message: 'disconnected'
    },
    {
        state: 1,
        message: 'connected'
    },
    {
        state: 2,
        message: 'connecting'
    },
    {
        state: 3,
        message: 'disconnecting'
    },
    {
        state: 4,
        message: 'invalid credentials'
    }
]

const connectDB = async () => {
    try {
        const mongooseOptions = {
            user: process.env.MONGO_USER,
            pass: process.env.MONGO_PASS,
            dbName: process.env.MONGO_DB
        };
        await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
        const state = Number(mongoose.connection.readyState);
        const Check = dbState.find(state => state.state === mongoose.connection.readyState);
        console.log(Check);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

module.exports = connectDB;