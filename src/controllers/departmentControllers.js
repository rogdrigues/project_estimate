const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const Department = require('../models/department');

module.exports = {
    addDepartment: async (req, res) => {
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
            const { name, description, division, lead, code, logo } = req.body;

            const newDepartment = new Department({
                name,
                description,
                division,
                lead,
                code,
                logo
            });

            await newDepartment.save();
            return res.status(201).json({
                EC: 0,
                message: "Department created successfully",
                data: {
                    result: newDepartment,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating Department",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateDepartment: async (req, res) => {
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
            const { name, description, division, lead, code, logo } = req.body;

            const updatedDepartment = await Department.findByIdAndUpdate(
                id,
                { name, description, division, lead, code, logo },
                { new: true }
            );

            if (!updatedDepartment) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Department updated successfully",
                data: {
                    result: updatedDepartment,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating Department",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    deleteDepartment: async (req, res) => {
        try {
            const { id } = req.params;

            const deletedDepartment = await Department.deleteById(id);

            if (!deletedDepartment) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Department deleted successfully",
                data: {
                    result: deletedDepartment,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting Department",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllDepartments: async (req, res) => {
        try {
            const departments = await Department.find()
                .populate('division', 'name')
                .populate('lead', 'username email')
                .sort({ createdAt: -1, deleted: 1 });

            return res.status(200).json({
                EC: 0,
                message: "Departments fetched successfully",
                data: {
                    result: departments
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Departments",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getDepartmentById: async (req, res) => {
        try {
            const { id } = req.params;
            const department = await Department.findById(id)
                .populate('division', 'name')
                .populate('lead', 'username email');

            if (!department) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Department fetched successfully",
                data: {
                    result: department,
                    metadata: {
                        id: department._id,
                        name: department.name,
                        description: department.description,
                        code: department.code,
                        division: department.division,
                        lead: department.lead,
                        logo: department.logo,
                    }
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching Department",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
};
