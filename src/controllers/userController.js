const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');

module.exports = {
    addNewUser: async (req, res) => {
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

        const { username, email, password, role, division, department, profile } = req.body;

        try {
            let user = await UserMaster.findOne({ email });
            if (user) {
                return res.status(400).json({
                    EC: 1,
                    message: "User already exists",
                    data: {
                        result: null
                    }
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new UserMaster({
                username,
                email,
                password: hashedPassword,
                role,
                division,
                department,
                profile
            });

            await user.save();

            return res.status(200).json({
                EC: 0,
                message: "User added successfully",
                data: {
                    result: {
                        userId: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        division: user.division,
                        department: user.department,
                        profile: user.profile,
                        createdAt: user.createdAt
                    }
                }
            });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({
                EC: 2,
                message: "Server error",
                data: {
                    result: null
                }
            });
        }
    },
    loginUser: async (req, res) => {
        const errors = validationResult(req.body);
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

        const { email, password } = req.body;

        try {
            let user = await UserMaster.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    EC: 1,
                    message: "Cannot find user with this email",
                    data: {
                        result: null
                    }
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    EC: 1,
                    message: "Invalid Credentials",
                    data: {
                        result: null
                    }
                });
            }

            const accessToken = generateToken(user.id, process.env.ACCESS_TOKEN_EXPIRES_IN);
            const refreshToken = generateToken(user.id, process.env.REFRESH_TOKEN_EXPIRES_IN);

            user.refreshToken = refreshToken;
            await user.save();

            return res.status(200).json({
                EC: 0,
                message: "Login successful",
                data: {
                    result: {
                        access_token: accessToken,
                        refresh_token: refreshToken
                    },
                    metadata: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        division: user.division,
                        department: user.department,
                        profile: user.profile,
                        lastLogin: user.lastLogin || null
                    }
                }
            });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({
                EC: 2,
                message: "Server error",
                data: {
                    result: null
                }
            });
        }
    },

    refreshAccessToken: async (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                EC: 1,
                message: "No refresh token provided",
                data: {
                    result: null
                }
            });
        }

        try {
            let user = await UserMaster.findOne({ refreshToken });
            if (!user) {
                return res.status(403).json({
                    EC: 1,
                    message: "Invalid refresh token",
                    data: {
                        result: null
                    }
                });
            }

            jwt.verify(refreshToken, process.env.JWT_SECRET, (err, userData) => {
                if (err) {
                    return res.status(403).json({
                        EC: 1,
                        message: "Invalid refresh token",
                        data: {
                            result: null
                        }
                    });
                }

                const accessToken = generateToken(user.id, process.env.ACCESS_TOKEN_EXPIRES_IN); // Sử dụng thời gian hết hạn từ .env

                return res.status(200).json({
                    EC: 0,
                    message: "Access token refreshed successfully",
                    data: {
                        result: { accessToken },
                        metadata: {
                            userId: user.id
                        }
                    }
                });
            });
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({
                EC: 2,
                message: "Server error",
                data: {
                    result: null
                }
            });
        }
    }
};
