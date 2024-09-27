const Template = require('../models/template');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');
const UserMaster = require('../models/userMaster');

module.exports = {
    createTemplate: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { name, description, filePath, createdBy, category, tags } = req.body;

        try {
            const newTemplate = new Template({
                name: sanitizeString(name),
                description: sanitizeString(description),
                filePath,
                createdBy,
                category,
                tags,
                status: 'Draft'
            });

            await newTemplate.save();

            return res.status(201).json({
                EC: 0,
                message: "Template created successfully",
                data: { result: newTemplate }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating template",
                data: { error: error.message }
            });
        }
    },
    updateTemplate: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { id } = req.params;
        const { name, description, filePath, category, tags, status } = req.body;

        try {
            const template = await Template.findById(id);
            if (!template) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            template.name = sanitizeString(name) || template.name;
            template.description = sanitizeString(description) || template.description;
            template.filePath = filePath || template.filePath;
            template.category = category || template.category;
            template.tags = tags || template.tags;
            template.status = status || template.status;

            await template.save();

            return res.status(200).json({
                EC: 0,
                message: "Template updated successfully",
                data: { result: template }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating template",
                data: { error: error.message }
            });
        }
    },
    deleteTemplate: async (req, res) => {
        const { id } = req.params;

        try {
            const template = await Template.findById(id);
            if (!template) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            await template.delete();

            return res.status(200).json({
                EC: 0,
                message: "Template deleted successfully",
                data: { result: template }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting template",
                data: { error: error.message }
            });
        }
    },
    getAllTemplates: async (req, res) => {
        const { includeDeleted } = req.query;
        const sortCriteria = { createdAt: -1 };
        const userRole = req.user.role;
        const userId = req.user._id;

        try {
            let templates;

            if (userRole === 'Admin' || userRole === 'Opportunity Lead') {
                if (includeDeleted === 'true') {
                    templates = await Template.findWithDeleted({ createdBy: userId }).sort(sortCriteria).exec();
                } else {
                    templates = await Template.find({ createdBy: userId }).sort(sortCriteria).exec();
                }
            } else if (userRole === 'Presale Division' || userRole === 'Presale Department') {
                if (includeDeleted === 'true') {
                    templates = await Template.findWithDeleted({ status: 'Published' }).sort(sortCriteria).exec();
                } else {
                    templates = await Template.find({ status: 'Published' }).sort(sortCriteria).exec();
                }
            }

            return res.status(200).json({
                EC: 0,
                message: "Templates fetched successfully",
                data: { result: templates }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching templates",
                data: { error: error.message }
            });
        }
    },
    getTemplateById: async (req, res) => {
        const { id } = req.params;

        try {
            const template = await Template.findById(id);
            if (!template) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Template fetched successfully",
                data: { result: template }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching template",
                data: { error: error.message }
            });
        }
    },
    restoreTemplate: async (req, res) => {
        const { id } = req.params;

        try {
            const template = await Template.findOneWithDeleted({ _id: id });
            if (!template) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            await template.restore();

            return res.status(200).json({
                EC: 0,
                message: "Template restored successfully",
                data: { result: template }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring template",
                data: { error: error.message }
            });
        }
    },
    getPublishedTemplatesForProject: async (req, res) => {
        const userId = req.user._id;

        try {
            const user = await UserMaster.findById(userId).select('role');
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: null
                });
            }

            let templates;

            if (user.role === 'Opportunity Lead') {
                templates = await Template.find({ status: 'Published' })
                    .sort({ createdAt: -1 })
                    .exec();
            } else {
                return res.status(403).json({
                    EC: 1,
                    message: "You do not have permission to access this resource",
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Published templates for project fetched successfully",
                data: { result: templates }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching published templates for project",
                data: { error: error.message }
            });
        }
    },
    downloadTemplateSample: async (req, res) => {
        try {
            const templatePath = path.join(__dirname, '../uploads/templates/template_file.xlsx');

            if (fs.existsSync(templatePath)) {
                return res.download(templatePath, 'template_file.xlsx', (err) => {
                    if (err) {
                        return res.status(500).json({
                            EC: 1,
                            message: "Error downloading template",
                            data: { error: err.message }
                        });
                    }
                });
            } else {
                return res.status(404).json({
                    EC: 1,
                    message: "Template file not found",
                    data: null
                });
            }
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error occurred while processing your request",
                data: { error: error.message }
            });
        }
    }
};
