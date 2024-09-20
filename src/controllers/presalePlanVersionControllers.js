const PresalePlanVersion = require('../models/presalePlanVersion');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');

module.exports = {
    createPresalePlanVersion: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { presalePlan, versionNumber, changes } = req.body;

        try {
            const newVersion = new PresalePlanVersion({
                presalePlan,
                versionNumber,
                changes: sanitizeString(changes),
                updatedBy: req.user._id
            });

            await newVersion.save();

            return res.status(201).json({
                EC: 0,
                message: 'Presale Plan Version created successfully',
                data: newVersion
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating presale plan version',
                data: { error: error.message }
            });
        }
    }
};
