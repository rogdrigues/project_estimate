const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');

module.exports = {
    updateDivisionLeads: async () => {
        //Get data from userMaster collection
        const users = await UserMaster.find({ division: { $exists: true, $ne: null } });
        //Update division leads
        await Promise.all(users.map(async user => {
            const division = await Division.findById(user.division);
            division.lead = user._id;
            await division.save();
        }));
    }
};
