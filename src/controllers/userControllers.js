const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserMaster = require('../models/userMaster');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const PermissionSet = require('../models/permissionSet');
const xlsx = require('xlsx');
const validator = require('validator');
const Division = require('../models/division');
const Department = require('../models/department');
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const cloudinary = require('cloudinary').v2;
const { sanitizeString, generateDisplayName } = require('../utils/sanitizeString');

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

        const { email, role, division, department, profile } = req.body;

        //sanitize input
        email = sanitizeString(email);
        profile.fullName = sanitizeString(profile.fullName);
        profile.phoneNumber = sanitizeString(profile.phoneNumber);
        profile.location = sanitizeString(profile.location);

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

            let username = profile.fullName.replace(/\s+/g, '').toLowerCase();
            let existingUsername = await UserMaster.findOne({ username });
            while (existingUsername) {
                const code = Math.floor(100 + Math.random() * 900);
                username = `${username}${code}`;
                existingUsername = await UserMaster.findOne({ username });
            }
            // Generate displayName
            const displayName = generateDisplayName(profile.fullName);

            //default password when adding new user
            const password = process.env.DEFAULT_PASSWORD;
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
        const { role, division, department, profile, password } = req.body;

        //sanitize input
        profile.fullName = sanitizeString(profile.fullName);
        profile.phoneNumber = sanitizeString(profile.phoneNumber);
        profile.location = sanitizeString(profile.location);

        try {
            const user = await UserMaster.findById(userId)
                .populate('role')
                .populate('division')
                .populate('department');

            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: {
                        result: null
                    }
                });
            }

            if (role && role !== user.role.toString()) {
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
                user.role = role;
            }

            if (profile && profile.fullName) {
                let username = profile.fullName.replace(/\s+/g, '').toLowerCase();
                let existingUsername = await UserMaster.findOne({ username });

                while (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
                    const code = Math.floor(100 + Math.random() * 900);
                    username = `${username}${code}`;
                    existingUsername = await UserMaster.findOne({ username });
                }

                user.username = username;
                user.displayName = generateDisplayName(profile.fullName);
            }

            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }

            user.division = division || user.division;
            user.department = department || user.department;
            user.profile = { ...user.profile, ...profile };

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
    updateUserProfile: async (req, res) => {
        const userId = req.user.id;
        const profileFields = ['fullName', 'dateOfBirth', 'gender', 'phoneNumber', 'location'];
        const updateFields = {};

        profileFields.forEach(field => {
            if (req.body[field]) {
                updateFields[`profile.${field}`] = req.body[field];
            }
        });

        //sanitize input
        updateFields['profile.fullName'] = sanitizeString(updateFields['profile.fullName']);
        updateFields['profile.phoneNumber'] = sanitizeString(updateFields['profile.phoneNumber']);
        updateFields['profile.location'] = sanitizeString(updateFields['profile.location']);


        try {
            const user = await UserMaster.findById(userId)
                .populate('role')
                .populate('division')
                .populate('department');
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: { result: null }
                });
            }

            if (req.file) {
                if (user.profile.avatar) {
                    const publicId = user.profile.avatar.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                }
                updateFields['profile.avatar'] = req.file.path;
            }

            user.set(updateFields);

            await user.save();

            return res.status(200).json({
                EC: 0,
                message: "Profile updated successfully",
                data: {
                    result: user.profile
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while updating profile",
                data: { result: null, error: error.message }
            });
        }
    },

    getUserById: async (req, res) => {
        const { userId } = req.params;

        try {
            const user = await UserMaster.findById(userId)
                .populate('role')
                .populate('division')
                .populate('department');
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
            const { includeDeleted } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let users;

            if (includeDeleted) {
                users = await UserMaster.findWithDeleted()
                    .populate('role')
                    .populate('division')
                    .populate('department')
                    .sort(sortCriteria)
                    .select('-password -refreshToken')
                    .exec();
            } else {
                users = await UserMaster.find()
                    .populate('role')
                    .populate('division')
                    .populate('department')
                    .sort(sortCriteria)
                    .select('-password -refreshToken')
                    .exec();
            }

            const totalUsers = await UserMaster.countDocuments();

            return res.status(200).json({
                EC: 0,
                message: "Users fetched successfully",
                data: {
                    result: users
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
            const user = await UserMaster.findById(userId)
                .populate('role')
                .populate('division')
                .populate('department');

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
            const user = await UserMaster.findOneWithDeleted({ _id: userId }).select("-password");
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

        //sanitize input
        email = sanitizeString(email);

        try {
            let user = await UserMaster.findOneWithDeleted({ email })
                .populate('role')
                .populate('division')
                .populate('department');

            if (!user) {
                return res.status(400).json({
                    EC: 1,
                    message: "Cannot find user with this email",
                    data: {
                        result: null
                    }
                });
            }

            if (user.deleted) {
                return res.status(403).json({
                    EC: 1,
                    message: "Your account has been deactivated. Please contact support.",
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

            const accessToken = generateToken(user._id, 'access');
            const refreshToken = generateToken(user._id, 'refresh');

            user.refreshToken = refreshToken;
            await user.save();

            const accessTokenExpiresAt = Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000;

            return res.status(200).json({
                EC: 0,
                message: "Login successful",
                data: {
                    result: {
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        access_token_expires_at: accessTokenExpiresAt
                    },
                    metadata: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        profile: {
                            avatar: user.profile.avatar || null,
                        },
                        lastLogin: user.lastLogin || null
                    }
                }
            });
        } catch (err) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while logging in",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    refreshAccessToken: async (req, res) => {
        const refreshToken = req.headers.cookie;
        if (!refreshToken) {
            return res.status(403).json({
                EC: 1,
                message: "Refresh token not provided",
                data: {
                    result: null
                }
            });
        }

        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            const user = await UserMaster.findById(decoded.user.id)
                .populate('role')
                .populate('division')
                .populate('department');

            if (!user || user.refreshToken !== refreshToken) {
                return res.status(403).json({
                    EC: 1,
                    message: "Invalid or expired refresh token",
                    data: {
                        result: null
                    }
                });
            }

            const accessToken = generateToken(user._id, 'access');

            const newRefreshToken = generateToken(user._id, 'refresh');
            user.refreshToken = newRefreshToken;
            await user.save();

            const accessTokenExpiresAt = Date.now() + parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) * 60 * 1000;

            return res.status(200).json({
                EC: 0,
                message: "Access token refreshed successfully",
                data: {
                    result: {
                        access_token: accessToken,
                        refresh_token: newRefreshToken,
                        access_token_expires_at: accessTokenExpiresAt
                    },
                    metadata: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        division: user.division,
                        department: user.department,
                        profile: {
                            avatar: user.profile.avatar || null,
                        },
                        lastLogin: user.lastLogin || null
                    }
                }
            });

        } catch (error) {
            console.error("Error refreshing access token:", error.message);
            return res.status(403).json({
                EC: 1,
                message: "Invalid refresh token",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    exportUsers: async (req, res) => {
        try {
            const sortCriteria = { 'role.roleName': 1, deleted: 1, createdAt: -1 };

            const users = await UserMaster.findWithDeleted()
                .populate('role')
                .populate('division')
                .populate('department')
                .sort(sortCriteria)
                .select('-password -refreshToken')
                .exec();

            // Convert data to an array of objects
            const userData = users.map(user => ({
                Username: user.username,
                DisplayName: user.displayName,
                Email: user.email,
                Role: user.role ? user.role.roleName : 'N/A',
                Division: user.division ? user.division.code : 'N/A',
                Department: user.department ? user.department.code : 'N/A',
            }));

            // Create a new workbook and worksheet
            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(userData, { skipHeader: true });

            // Add headers (in bold)
            const headers = ['Username', 'DisplayName', 'Email', 'Role', 'Division', 'Department'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });

            // Apply styles to the headers (bold)
            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });  // Cell reference (e.g., A1, B1, etc.)
                if (!workSheet[cellRef]) workSheet[cellRef] = {};  // Initialize cell if it's undefined
                workSheet[cellRef].s = { font: { bold: true } };  // Apply bold font
            });

            // Auto width calculation based on the maximum length in each column
            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length, // Header length
                    ...userData.map(row => (row[header] || '').toString().length) // Data length
                )
            }));
            workSheet['!cols'] = columnWidths;

            // Append the worksheet to the workbook
            xlsx.utils.book_append_sheet(workBook, workSheet, 'Users');

            // Write the Excel file to buffer
            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            // Generate a unique file name
            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const formattedTime = date.toTimeString().slice(0, 5).replace(/:/g, '');
            const fileName = `users_export_${formattedDate}_${formattedTime}.xlsx`;

            // Set the response headers and send the file
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while exporting users",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    importUsers: [
        upload.single('file'),
        async (req, res) => {
            try {
                if (!req.file) {
                    return res.status(400).json({
                        EC: 1,
                        message: "No file uploaded",
                        data: { error: "Please upload a file" }
                    });
                }

                const updateExisting = true;
                const file = req.file;

                const workBook = xlsx.read(file.buffer, { type: 'buffer' });
                const workSheet = workBook.Sheets[workBook.SheetNames[0]];

                const rows = xlsx.utils.sheet_to_json(workSheet, { header: 1 }).slice(1);

                let errors = [];

                for (let row of rows) {
                    let [fullName, displayName, email, role, division, department] = row;
                    let username = fullName.replace(/\s+/g, '').toLowerCase();

                    //sanitize input
                    fullName = sanitizeString(fullName);
                    email = sanitizeString(email);
                    username = sanitizeString(username);
                    role = sanitizeString(role);
                    division = sanitizeString(division);
                    department = sanitizeString(department);

                    displayName = generateDisplayName(fullName);

                    let existingUser = await UserMaster.findOne({ email });
                    if (existingUser) {
                        if (updateExisting) {
                            existingUser.email = email || existingUser.email;

                            let duplicateUser = await UserMaster.findOne({ username });
                            while (duplicateUser && duplicateUser._id.toString() !== existingUser._id.toString()) {
                                const code = Math.floor(100 + Math.random() * 900);
                                username = `${username}${code}`;
                                duplicateUser = await UserMaster.findOne({ username });
                            }

                            existingUser.username = username;
                            existingUser.displayName = generateDisplayName(fullName);

                            const validRole = await PermissionSet.findOne({ roleName: role });
                            if (validRole) {
                                existingUser.role = validRole._id;
                            }

                            const validDivision = division && division !== 'N/A' ? await Division.findOne({ code: division }) : null;
                            existingUser.division = validDivision ? validDivision._id : existingUser.division;

                            const validDepartment = department && department !== 'N/A' ? await Department.findOne({ code: department }) : null;
                            existingUser.department = validDepartment ? validDepartment._id : existingUser.department;

                            await existingUser.save();
                        } else {
                            errors.push({ row, message: `Username ${username} is already taken.` });
                            continue;
                        }
                    } else {
                        const validRole = await PermissionSet.findOne({ roleName: role });
                        if (!validRole) {
                            errors.push({ row, message: `Role ${role} does not exist.` });
                            continue;
                        }

                        let validDivision = null;
                        if (division && division !== 'N/A') {
                            validDivision = await Division.findOne({ code: division });
                            if (!validDivision) {
                                errors.push({ row, message: `Division ${division} does not exist.` });
                                continue;
                            }
                        }

                        let validDepartment = null;
                        if (department && department !== 'N/A') {
                            validDepartment = await Department.findOne({ code: department });
                            if (!validDepartment) {
                                errors.push({ row, message: `Department ${department} does not exist.` });
                                continue;
                            }
                        }

                        let duplicateUser = await UserMaster.findOne({ username });
                        while (duplicateUser) {
                            const code = Math.floor(100 + Math.random() * 900);
                            username = `${username}${code}`;
                            duplicateUser = await UserMaster.findOne({ username });
                        }

                        const newUser = new UserMaster({
                            username,
                            displayName,
                            email,
                            role: validRole._id,
                            division: validDivision ? validDivision._id : null,
                            department: validDepartment ? validDepartment._id : null,
                            password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD, 10),
                            profile: { fullName }
                        });

                        await newUser.save();
                    }
                }

                if (errors.length > 0) {
                    const errorWorkBook = xlsx.utils.book_new();
                    const errorSheetData = errors.map(error => ({
                        Row: error.row.join(', '),
                        ErrorMessage: error.message
                    }));

                    const errorWorkSheet = xlsx.utils.json_to_sheet(errorSheetData);

                    const maxLengths = errorSheetData.reduce((acc, curr) => {
                        Object.keys(curr).forEach((key, i) => {
                            acc[i] = Math.max(acc[i] || 10, curr[key].length);
                        });
                        return acc;
                    }, []);

                    errorWorkSheet['!cols'] = maxLengths.map((width) => ({ wch: width }));

                    xlsx.utils.book_append_sheet(errorWorkBook, errorWorkSheet, 'Errors');

                    const errorBuffer = xlsx.write(errorWorkBook, { type: 'buffer', bookType: 'xlsx' });

                    const date = new Date();
                    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
                    const formattedTime = date.toTimeString().slice(0, 5).replace(/:/g, '');
                    const fileName = `import_errors_${formattedDate}_${formattedTime}.xlsx`;

                    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

                    return res.status(200).send(errorBuffer);
                }

                return res.status(201).json({
                    EC: 0,
                    message: "Users imported successfully"
                });

            } catch (error) {
                console.error("Error importing users:", error.message);
                return res.status(500).json({
                    EC: 1,
                    message: "An error occurred during import",
                    data: { error: error.message }
                });
            }
        }
    ]
};
