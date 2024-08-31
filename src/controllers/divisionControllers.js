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
    },
    addDivision: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: {
                    result: null,
                    errors: errors.array()
                }
            });
        }

        try {
            const { name, description, lead, code, logo } = req.body;

            const newDivision = new Division({
                name,
                description,
                lead,
                code,
                logo
            });

            await newDivision.save();
            return res.status(201).json({
                EC: 0,
                message: "Division created successfully",
                data: {
                    result: newDivision,
                    metadata: {
                        name: newDivision.name,
                        description: newDivision.description,
                        code: newDivision.code,
                        lead: newDivision.lead,
                        logo: newDivision.logo,
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating Division",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateDivision: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: {
                    result: null,
                    errors: errors.array()
                }
            });
        }

        try {
            const { id } = req.params;
            const { name, description, lead, code, logo } = req.body;

            const updatedDivision = await Division.findByIdAndUpdate(
                id,
                { name, description, lead, code, logo },
                { new: true }
            );

            if (!updatedDivision) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Division updated successfully",
                data: {
                    result: updatedDivision,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating Division",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    deleteDivision: async (req, res) => {
        try {
            const { id } = req.params;

            const deletedDivision = await Division.deleteById(id);

            if (!deletedDivision) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Division deleted successfully",
                data: {
                    result: deletedDivision,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting Division",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllDivisions: async (req, res) => {
        try {
            const divisions = await Division.find()
                .populate('lead', 'username email')
                .sort({ createdAt: -1 });

            return res.status(200).json({
                EC: 0,
                message: "Divisions fetched successfully",
                data: {
                    result: divisions,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Divisions",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getDivisionById: async (req, res) => {
        try {
            const { id } = req.params;
            const division = await Division.findById(id)
                .populate('lead', 'username email');

            if (!division) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Division fetched successfully",
                data: {
                    result: division,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Division",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
};
