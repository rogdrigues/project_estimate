const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateToken = require('../services/authService');
const { validationResult } = require('express-validator');
const { get } = require('mongoose');
const Department = require('../models/department');
const Division = require('../models/division');
const PermissionSet = require('../models/permissionSet');
const xlsx = require('xlsx');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const memoryStorage = multer.memoryStorage();
const upload = multer({ storage: memoryStorage });
const UserMaster = require('../models/userMaster');
const { sanitizeString } = require('../utils/stringUtils');

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
            let { name, description, division, lead, code } = req.body;

            description = sanitizeString(description);

            let departmentCode = code;

            if (!departmentCode) {
                const nameWords = name.trim().split(/\s+/);
                departmentCode = nameWords.map(word => word[0].toUpperCase()).join('');
            }

            let existingDepartment = await Department.findOne({ code: departmentCode });

            while (existingDepartment) {
                const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                departmentCode = `${departmentCode}${randomSuffix}`;
                existingDepartment = await Department.findOne({ code: departmentCode });
            }

            const newDepartment = new Department({
                name,
                description,
                division,
                lead,
                code: departmentCode,
                logo: req.file ? req.file.path : null
            });

            await newDepartment.save();

            return res.status(201).json({
                EC: 0,
                message: "Department created successfully",
                data: {
                    result: newDepartment
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
            let { name, description, division, lead, code } = req.body;
            let departmentCode = code;

            const department = await Department.findById(id);
            if (!department) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            if (!departmentCode) {
                const nameWords = name.trim().split(/\s+/);
                departmentCode = nameWords.map(word => word[0].toUpperCase()).join('');
            }

            let existingDepartment = await Department.findOne({ code: departmentCode, _id: { $ne: id } });

            while (existingDepartment) {
                const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                departmentCode = `${departmentCode}${randomSuffix}`;
                existingDepartment = await Department.findOne({ code: departmentCode });
            }

            department.name = name || department.name;
            department.description = description || department.description;
            department.division = division || department.division;
            department.lead = lead || department.lead;
            department.code = departmentCode;
            department.logo = req.file ? req.file.path : department.logo;

            await department.save();

            return res.status(200).json({
                EC: 0,
                message: "Department updated successfully",
                data: {
                    result: department
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

            const department = await Department.findById(id);

            if (!department) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            await department.delete();

            return res.status(200).json({
                EC: 0,
                message: "Department deleted successfully",
                data: {
                    result: department
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

    restoreDepartment: async (req, res) => {
        try {
            const { id } = req.params;

            const department = await Department.findOneWithDeleted({ _id: id });

            if (!department) {
                return res.status(404).json({
                    EC: 1,
                    message: "Department not found",
                    data: {
                        result: null
                    }
                });
            }

            await department.restore();

            return res.status(200).json({
                EC: 0,
                message: "Department restored successfully",
                data: {
                    result: department
                }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring Department",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    getAllDepartments: async (req, res) => {
        try {
            const { includeDeleted } = req.query;
            const sortCriteria = { deleted: 1, createdAt: -1 };

            let departments;

            if (includeDeleted === 'true') {
                departments = await Department.findWithDeleted()
                    .populate('division')
                    .populate('lead', 'username email')
                    .sort(sortCriteria)
                    .exec();
            } else {
                departments = await Department.find()
                    .populate('division')
                    .populate('lead', 'username email')
                    .sort(sortCriteria)
                    .exec();
            }

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

    getDepartmentLeads: async (req, res) => {
        try {
            const departmentLeadRole = await PermissionSet.findOne({ roleName: 'Department Lead' });

            if (!departmentLeadRole) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Department Lead role not found',
                    data: { result: null }
                });
            }

            //sort by name
            const departmentLeads = await UserMaster.find({ role: departmentLeadRole._id })
                .populate('department')
                .populate('role')
                .sort({ username: 1 })
                .select('-password -refreshToken')
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Department Leads fetched successfully',
                data: { result: departmentLeads }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching Department Leads',
                data: { result: null, error: error.message }
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
    exportDepartments: async (req, res) => {
        try {
            const departments = await Department.find()
                .populate('division', 'name')
                .populate('lead', 'username email')
                .sort({ createdAt: -1 })
                .select('name description division lead code')
                .exec();

            const departmentData = departments.map(department => ({
                Name: department.name,
                Description: department.description,
                Division: department.division ? department.division.name : 'N/A',
                Lead: department.lead ? department.lead.username : 'N/A',
                Code: department.code
            }));

            const workBook = xlsx.utils.book_new();
            const workSheet = xlsx.utils.json_to_sheet(departmentData, { skipHeader: true });

            const headers = ['Name', 'Description', 'Division', 'Lead', 'Code'];
            xlsx.utils.sheet_add_aoa(workSheet, [headers], { origin: 'A1' });
            xlsx.utils.sheet_add_json(workSheet, departmentData, { skipHeader: true, origin: 'A2' });
            headers.forEach((header, index) => {
                const cellRef = xlsx.utils.encode_cell({ c: index, r: 0 });
                if (!workSheet[cellRef]) workSheet[cellRef] = {};
                workSheet[cellRef].s = { font: { bold: true } };
            });

            const columnWidths = headers.map((header, i) => ({
                wch: Math.max(
                    header.length,
                    ...departmentData.map(row => (row[header] || '').toString().length)
                )
            }));
            workSheet['!cols'] = columnWidths;

            xlsx.utils.book_append_sheet(workBook, workSheet, 'Departments');

            const buffer = xlsx.write(workBook, { type: 'buffer', bookType: 'xlsx' });

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const formattedTime = date.toTimeString().slice(0, 5).replace(/:/g, '');
            const fileName = `departments_export_${formattedDate}_${formattedTime}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(buffer);

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "An error occurred while exporting departments",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },
    importDepartments: [
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
                    let [name, description, divisionName, leadUsername, code] = row;

                    const validDivision = await Division.findOne({ name: divisionName });
                    if (!validDivision) {
                        errors.push({ row, message: `Division ${divisionName} does not exist.` });
                        continue;
                    }

                    const validLead = await UserMaster.findOne({ username: leadUsername });
                    if (!validLead) {
                        errors.push({ row, message: `Lead ${leadUsername} does not exist.` });
                        continue;
                    }

                    if (leadUser.role.roleName !== 'Department Lead') {
                        errors.push({
                            row,
                            message: `User ${leadUsername} is not a Department Lead.`
                        });
                        continue;
                    }

                    let departmentCode = code;
                    if (!departmentCode) {
                        const nameWords = name.split(' ');
                        departmentCode = nameWords.map(word => word[0].toUpperCase()).join('');
                    }

                    let department = await Department.findOne({ code: departmentCode });

                    if (department) {
                        department.name = name;
                        department.description = description;
                        department.division = validDivision._id;
                        department.lead = validLead._id;
                    } else {
                        department = new Department({
                            name,
                            description,
                            division: validDivision._id,
                            lead: validLead._id,
                            code: departmentCode
                        });
                    }

                    let existingDepartment = await Department.findOne({ code: departmentCode, _id: { $ne: department._id } });
                    while (existingDepartment) {
                        const randomSuffix = `-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
                        departmentCode = `${departmentCode}${randomSuffix}`;
                        existingDepartment = await Department.findOne({ code: departmentCode });
                    }

                    department.code = departmentCode;
                    await department.save();
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
                    message: "Departments imported successfully"
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
