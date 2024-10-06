const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const UserMaster = require('../models/userMaster');
const Division = require('../models/division');
const PermissionSet = require('../models/permissionSet');
const xlsx = require('xlsx');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const { sanitizeString } = require('../utils/stringUtils');

module.exports = {
    updateDivisionLeads: async () => {
        const users = await UserMaster.find({ division: { $exists: true, $ne: null } });
        await Promise.all(users.map(async user => {
            const division = await Division.findById(user.division);
            if (division != null) {
                division.lead = user._id;
                await division.save();
            }
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
            let { name, description, lead, code } = req.body;

            description = sanitizeString(description);
            name = sanitizeString(name);

            let divisionCode = code;

            if (!divisionCode) {
                const nameWords = name.split(' ');
                divisionCode = nameWords.map(word => word[0].toUpperCase()).join('');
            }

            let existingDivision = await Division.findOne({ code: divisionCode });

            while (existingDivision) {
                const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                divisionCode = `${divisionCode}${randomSuffix}`;
                existingDivision = await Division.findOne({ code: divisionCode });
            }

            const newDivision = new Division({
                name,
                description,
                lead,
                code: divisionCode,
                logo: req.file ? req.file.path : null
            });

            await newDivision.save();

            return res.status(201).json({
                EC: 0,
                message: "Division created successfully",
                data: {
                    result: newDivision
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
            let { name, description, lead, code } = req.body;

            description = sanitizeString(description);
            name = sanitizeString(name);

            let divisionCode = code;

            const division = await Division.findById(id);
            if (!division) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            if (!divisionCode) {
                const nameWords = name.split(' ');
                divisionCode = nameWords.map(word => word[0].toUpperCase()).join('');
            }

            let existingDivision = await Division.findOne({ code: divisionCode, _id: { $ne: id } });

            while (existingDivision) {
                const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                divisionCode = `${divisionCode}${randomSuffix}`;
                existingDivision = await Division.findOne({ code: divisionCode });
            }

            division.name = name || division.name;
            division.description = description || division.description;
            division.lead = lead || division.lead;
            division.code = divisionCode;
            division.logo = req.file ? req.file.path : division.logo;

            await division.save();

            return res.status(200).json({
                EC: 0,
                message: "Division updated successfully",
                data: {
                    result: division
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

            const division = await Division.findById(id);

            if (!division) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            await division.delete();

            return res.status(200).json({
                EC: 0,
                message: "Division deleted successfully",
                data: {
                    result: division
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

    restoreDivision: async (req, res) => {
        try {
            const { id } = req.params;

            const division = await Division.findOneWithDeleted({ _id: id });

            if (!division) {
                return res.status(404).json({
                    EC: 1,
                    message: "Division not found",
                    data: {
                        result: null
                    }
                });
            }

            await division.restore();

            return res.status(200).json({
                EC: 0,
                message: "Division restored successfully",
                data: {
                    result: division
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring Division",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllDivisions: async (req, res) => {
        try {
            const { includeDeleted } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let divisions;

            if (includeDeleted === 'true') {
                divisions = await Division.findWithDeleted()
                    .populate('lead', 'username email')
                    .sort(sortCriteria)
                    .exec();
            } else {
                divisions = await Division.find()
                    .populate('lead', 'username email')
                    .sort(sortCriteria)
                    .exec();
            }

            return res.status(200).json({
                EC: 0,
                message: "Divisions fetched successfully",
                data: {
                    result: divisions
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

    getDivisionLeads: async (req, res) => {
        try {
            const divisionLeadRole = await PermissionSet.findOne({ roleName: 'Division Lead' });

            if (!divisionLeadRole) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Division Lead role not found',
                    data: { result: null }
                });
            }

            const divisionLeads = await UserMaster.find({ role: divisionLeadRole._id })
                .populate('division')
                .populate('role')
                .sort({ username: 1 })
                .select('-password -refreshToken')
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Division Leads fetched successfully',
                data: { result: divisionLeads }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching Division Leads',
                data: { result: null, error: error.message }
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
                    metadata: {
                        id: division._id,
                        name: division.name,
                        description: division.description,
                        code: division.code,
                        lead: division.lead,
                        logo: division.logo,
                    }
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

    exportDivisions: async (req, res) => {
        try {
            const divisions = await Division.find()
                .populate('lead', 'username email')
                .sort({ createdAt: -1 })
                .select('name description lead code')
                .exec();

            const divisionData = divisions.map(division => ({
                Name: division.name,
                Description: division.description,
                Lead: division.lead ? division.lead.username : 'N/A',
                Code: division.code
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(divisionData, { skipHeader: true });

            const headers = ['Name', 'Description', 'Lead', 'Code'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, divisionData, { skipHeader: true, origin: 'A2' });
            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });
                if (!workSheet[cellRef]) workSheet[cellRef] = {};
                workSheet[cellRef].s = { font: { bold: true } };
            });

            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length,
                    ...divisionData.map(row => (row[header] || '').toString().length)
                )
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Divisions');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const formattedTime = date.toTimeString().slice(0, 5).replace(/:/g, '');
            const fileName = `divisions_export_${formattedDate}_${formattedTime}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while exporting divisions",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    importDivisions: [
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

                const file = req.file;
                const workBook = xlsx.read(file.buffer, { type: 'buffer' });
                const workSheet = workBook.Sheets[workBook.SheetNames[0]];

                const rows = xlsx.utils.sheet_to_json(workSheet, { header: 1 }).slice(1);

                let errors = [];

                for (let row of rows) {
                    let [name, description, leadUsername, code] = row;

                    description = sanitizeString(description);
                    name = sanitizeString(name);

                    const validLead = await UserMaster.findOne({ username: leadUsername });
                    if (!validLead) {
                        errors.push({ row, message: `Lead ${leadUsername} does not exist.` });
                        continue;
                    }

                    if (leadUser.role.roleName !== 'Division Lead') {
                        errors.push({
                            row,
                            message: `User ${leadUsername} is not a Division Lead.`
                        });
                        continue;
                    }

                    let divisionCode = code;
                    if (!divisionCode) {
                        const nameWords = name.split(' ');
                        divisionCode = nameWords.map(word => word[0].toUpperCase()).join('');
                    }

                    let division = await Division.findOne({ code: divisionCode });

                    if (division) {
                        division.name = name;
                        division.description = description;
                        division.lead = validLead._id;
                    } else {
                        division = new Division({
                            name,
                            description,
                            lead: validLead._id,
                            code: divisionCode
                        });
                    }

                    let existingDivision = await Division.findOne({ code: divisionCode, _id: { $ne: division._id } });
                    while (existingDivision) {
                        const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                        divisionCode = `${divisionCode}${randomSuffix}`;
                        existingDivision = await Division.findOne({ code: divisionCode });
                    }

                    division.code = divisionCode;
                    await division.save();
                }

                if (errors.length > 0) {
                    const errorWorkBook = xlsx.utils.book_new();
                    const errorSheetData = errors.map(error => ({
                        Row: error.row.join(', '),
                        ErrorMessage: error.message
                    }));

                    const errorWorkSheet = xlsx.utils.json_to_sheet(errorSheetData);

                    xlsx.utils.book_append_sheet(errorWorkBook, errorWorkSheet, 'Errors');

                    const errorBuffer = xlsx.write(errorWorkBook, { type: 'buffer', bookType: 'xlsx' });

                    const fileName = `import_errors_${new Date().toISOString()}.xlsx`;

                    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

                    return res.status(200).send(errorBuffer);
                }

                return res.status(201).json({
                    EC: 0,
                    message: "Divisions imported successfully"
                });

            } catch (error) {
                return res.status(500).json({
                    EC: 1,
                    message: "An error occurred during import",
                    data: { error: error.message }
                });
            }
        }
    ]
};
