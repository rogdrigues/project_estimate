const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const PermissionSet = require('../models/permissionSet');

module.exports = {
    getAllRoles: async (req, res) => {
        try {
            //Find all permissions but not list role of customer and guest
            const permissions = await PermissionSet.find({ roleName: { $nin: ['Customer', 'Guest'] } });

            return res.status(200).json({
                EC: 0,
                message: "Permissions fetched successfully",
                data: {
                    result: permissions,
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching permissions",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
};
