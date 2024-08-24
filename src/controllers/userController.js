const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');

const generateDisplayName = (username) => {
    const nameParts = username.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const initials = nameParts.slice(0, -1).map(name => name.charAt(0)).join('');
    const code = Math.floor(100 + Math.random() * 900);
    return `${lastName}${initials}${code}`;
};

module.exports = {
    addNewUser: async (req, res) => {
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

        const { username, email, password, role, division, department, profile } = req.body;

        try {
            // Check if email already exists
            const existingUser = await UserMaster.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    EC: 1,
                    message: "Email already exists",
                    data: {
                        result: null
                    }
                });
            }

            const validRole = await PermissionSet.findById(role);
            if (!validRole) {
                return res.status(400).json({
                    EC: 1,
                    message: "Role does not exist",
                    data: {
                        result: null
                    }
                });
            }

            // Generate displayName
            const displayName = generateDisplayName(username);

            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create a new user
            const newUser = new UserMaster({
                username,
                displayName,
                email,
                password: hashedPassword,
                role,
                division,
                department,
                profile
            });

            // Save user to the database
            await newUser.save();

            return res.status(201).json({
                EC: 0,
                message: "User added successfully",
                data: {
                    result: newUser
                }
            });

        } catch (error) {
            console.error("Error adding new user:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while adding the user",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    updateUser: async (req, res) => {
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

        const { userId } = req.params;
        const { username, email, password, role, division, department, profile } = req.body;

        try {
            // Find the user by ID
            const user = await UserMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: {
                        result: null
                    }
                });
            }

            // Check if the new email already exists (if it's different from the current one)
            if (email && email !== user.email) {
                const existingUser = await UserMaster.findOne({ email });
                if (existingUser) {
                    return res.status(400).json({
                        EC: 1,
                        message: "Email already in use",
                        data: {
                            result: null
                        }
                    });
                }
            }

            if (role && role !== user.role) {
                const validRole = await PermissionSet.findById(role);
                if (!validRole) {
                    return res.status(400).json({
                        EC: 1,
                        message: "Role does not exist",
                        data: {
                            result: null
                        }
                    });
                }
            }

            // Update fields
            if (username && username !== user.username) {
                user.username = username;
                user.displayName = generateDisplayName(username);
            }
            user.email = email || user.email;

            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            user.role = role || user.role;
            user.division = division || user.division;
            user.department = department || user.department;
            user.profile = { ...user.profile, ...profile };

            // Save the updated user to the database
            await user.save();

            return res.status(200).json({
                EC: 0,
                message: "User updated successfully",
                data: {
                    result: user
                }
            });

        } catch (error) {
            console.error("Error updating user:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while updating the user",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    getUserById: async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await UserMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: {
                        result: null
                    }
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "User fetched successfully",
                data: {
                    result: user
                }
            });

        } catch (error) {
            console.error("Error fetching user:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while fetching the user",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    getUsers: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;

            const skip = (page - 1) * limit;

            const sortCriteria = { deleted: 1, createdAt: -1 };

            const users = await UserMaster.find()
                .sort(sortCriteria)
                .skip(skip)
                .limit(parseInt(limit))
                .exec();

            const totalUsers = await UserMaster.countDocuments();

            return res.status(200).json({
                EC: 0,
                message: "Users fetched successfully",
                data: {
                    result: users,
                    pagination: {
                        total: totalUsers,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalUsers / limit)
                    }
                }
            });

        } catch (error) {
            console.error("Error fetching users:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while fetching users",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    deleteUser: async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await UserMaster.findById(userId);
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: {
                        result: null
                    }
                });
            }

            await user.delete();

            return res.status(200).json({
                EC: 0,
                message: "User deleted successfully",
                data: {
                    result: user
                }
            });

        } catch (error) {
            console.error("Error deleting user:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while deleting the user",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    restoreUser: async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await UserMaster.findOneWithDeleted({ _id: userId });
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: {
                        result: null
                    }
                });
            }

            await user.restore();

            return res.status(200).json({
                EC: 0,
                message: "User restored successfully",
                data: {
                    result: user
                }
            });

        } catch (error) {
            console.error("Error restoring user:", error.message);
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while restoring the user",
                data: {
                    result: null,
                    error: error.message
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
