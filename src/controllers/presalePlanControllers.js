const PresalePlan = require('../models/presalePlan');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');

module.exports = {
    createPresalePlan: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { opportunity, name, description, department, division } = req.body;

        try {
            const newPresalePlan = new PresalePlan({
                opportunity,
                name: sanitizeString(name),
                description: sanitizeString(description),
                createdBy: req.user._id,  // Assuming req.user contains the logged-in user's ID
                department,
                division
            });

            await newPresalePlan.save();

            return res.status(201).json({
                EC: 0,
                message: 'Presale Plan created successfully',
                data: newPresalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error creating presale plan',
                data: { error: error.message }
            });
        }
    },

    updatePresalePlan: async (req, res) => {
        const { id } = req.params;
        const { name, description, status } = req.body;

        try {
            const presalePlan = await PresalePlan.findById(id);
            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            presalePlan.name = sanitizeString(name) || presalePlan.name;
            presalePlan.description = sanitizeString(description) || presalePlan.description;
            presalePlan.status = status || presalePlan.status;

            await presalePlan.save();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan updated successfully',
                data: presalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating presale plan',
                data: { error: error.message }
            });
        }
    },

    getAllPresalePlans: async (req, res) => {
        try {
            const presalePlans = await PresalePlan.find().populate('opportunity department division createdBy').exec();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plans fetched successfully',
                data: { result: presalePlans }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching presale plans',
                data: { error: error.message }
            });
        }
    },

    getPresalePlanById: async (req, res) => {
        const { id } = req.params;

        try {
            const presalePlan = await PresalePlan.findById(id).populate('opportunity department division createdBy');
            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan fetched successfully',
                data: { result: presalePlan }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching presale plan',
                data: { error: error.message }
            });
        }
    }
};
