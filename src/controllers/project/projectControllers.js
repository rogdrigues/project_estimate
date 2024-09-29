const Project = require('../../models/project/project');
const Template = require('../../models/template/template');
const Opportunity = require('../../models/opportunity/presaleOpportunity');
const UserMaster = require('../../models/userMaster');
const TemplateData = require('../../models/template/templateData');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../../utils/stringUtils');
const moment = require('moment');
const ProjectVersion = require('../../models/project/projectVersion');
const formattedDate = moment().format('MM-DD-YYYY');
const formattedDateTime = moment().format('MM-DD-YYYY HH:mm:ss');

module.exports = {
    createProject: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { name, description, category, opportunity, template, reviewer } = req.body;

        try {
            const existingProject = await Project.findOne({ name: sanitizeString(name) });
            if (existingProject) {
                return res.status(400).json({
                    EC: 1,
                    message: "Project with this name already exists",
                    data: null
                });
            }

            const [currentUser, opportunityData, templateData, reviewersData] = await Promise.all([
                UserMaster.findById(req.user.id).populate('division department').exec(),
                Opportunity.findById(opportunity),
                Template.findById(template),
                UserMaster.find({ _id: { $in: reviewer } }).populate('role')
            ]);

            if (!opportunityData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Opportunity not found",
                    data: null
                });
            }

            if (!templateData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            const validReviewers = reviewersData.filter(user => {
                return user.role && user.role.permissions.includes('project_review');
            });

            if (validReviewers.length === 0) {
                return res.status(400).json({
                    EC: 1,
                    message: "No valid reviewers found with the permission",
                    data: null
                });
            }

            const newProject = new Project({
                name: sanitizeString(name),
                description: sanitizeString(description),
                category,
                opportunity,
                template,
                reviewer: validReviewers.map(rev => rev._id),
                status: 'Pending',
                createdBy: req.user.id
            });

            await newProject.save();


            const newTemplateData = new TemplateData({
                templateId: templateData._id,
                projectData: {
                    projectName: newProject.name,
                    customer: opportunityData.customer,
                    status: newProject.status,
                    division: currentUser.division.code,
                    lastModifier: formattedDate
                },
                version: {
                    versionNumber: 1,
                    versionDate: moment().format('MM-DD-YYYY'),
                    createdBy: req.user.id
                },
                changesLog: [
                    {
                        dateChanged: formattedDateTime,
                        versionDate: formattedDate,
                        versionNumber: 1,
                        action: 'A',
                        changes: 'Initial project creation with basic details and template assignment'
                    }
                ]
            });

            const initialVersion = new ProjectVersion({
                project: newProject._id,
                versionNumber: 1,
                changes: 'Initial project creation with basic details and template assignment',
                updatedBy: req.user.id
            });

            await initialVersion.save();

            await newTemplateData.save();

            return res.status(201).json({
                EC: 0,
                message: "Project and TemplateData created successfully",
                data: {
                    result: newProject,
                }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error creating project",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateProject: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { id } = req.params;
        const { name, description, category, opportunity, template, reviewer } = req.body;

        try {
            const project = await Project.findById(id).populate('reviewer', 'username');
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            const [opportunityData, templateData, reviewersData] = await Promise.all([
                Opportunity.findById(opportunity),
                Template.findById(template),
                UserMaster.find({ _id: { $in: reviewer } }).populate('role', 'permissions').select('username')
            ]);

            if (!opportunityData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Opportunity not found",
                    data: null
                });
            }

            if (!templateData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            const validReviewers = reviewersData.filter(user => {
                return user.role && user.role.permissions.includes('project_review');
            });

            if (validReviewers.length === 0) {
                return res.status(400).json({
                    EC: 1,
                    message: "No valid reviewers found with the permission",
                    data: null
                });
            }

            const changes = [];

            if (project.name !== name) changes.push(`Name changed from "${project.name}" to "${sanitizeString(name)}"`);
            if (project.description !== description) changes.push(`Description changed from "${project.description}" to "${sanitizeString(description)}"`);
            if (project.category !== category) changes.push(`Category changed from "${project.category}" to "${category}"`);
            if (project.opportunity.toString() !== opportunity) changes.push(`Opportunity changed from "${project.opportunity}" to "${opportunity}"`);
            if (project.template.toString() !== template) changes.push(`Template changed from "${project.template}" to "${template}"`);

            const oldReviewerIds = project.reviewer.map(rev => rev._id.toString());
            const newReviewerIds = validReviewers.map(rev => rev._id.toString());
            if (JSON.stringify(oldReviewerIds) !== JSON.stringify(newReviewerIds)) {
                const removedReviewers = project.reviewer.filter(rev => !newReviewerIds.includes(rev._id.toString()));
                const addedReviewers = validReviewers.filter(rev => !oldReviewerIds.includes(rev._id.toString()));

                const removedReviewerNames = removedReviewers.map(rev => rev.username).join(', ');
                const addedReviewerNames = addedReviewers.map(rev => rev.username).join(', ');

                let reviewerChangeMessage = `Reviewers transferred responsibility. `;
                if (removedReviewerNames && addedReviewerNames) {
                    reviewerChangeMessage += `Transferred from: ${removedReviewerNames} to ${addedReviewerNames}.`;
                } else if (addedReviewerNames) {
                    reviewerChangeMessage += `Assigned to: ${addedReviewerNames}.`;
                }

                changes.push(reviewerChangeMessage);
            }

            project.name = sanitizeString(name) || project.name;
            project.description = sanitizeString(description) || project.description;
            project.category = category || project.category;
            project.opportunity = opportunity || project.opportunity;
            project.template = template || project.template;
            project.reviewer = validReviewers.map(rev => rev._id) || project.reviewer;
            project.status = "In Progress"; //Start working at the first updated
            await project.save();

            if (changes.length > 0) {
                const newVersion = new ProjectVersion({
                    project: project._id,
                    versionNumber: project.version ? project.version.versionNumber + 1 : 1,
                    changes: changes.join(', '),
                    updatedBy: req.user.id
                });

                await newVersion.save();
            }

            const templateDataToUpdate = await TemplateData.findOne({ templateId: templateData._id });
            templateDataToUpdate.projectData.projectName = project.name;
            templateDataToUpdate.projectData.customer = opportunityData.customer;
            templateDataToUpdate.projectData.status = project.status;
            templateDataToUpdate.projectData.lastModifier = formattedDateTime;
            templateDataToUpdate.projectData.status = "In Progress"

            if (changes.length > 0) {
                templateDataToUpdate.changesLog.push({
                    dateChanged: formattedDateTime,
                    versionDate: formattedDate,
                    versionNumber: templateDataToUpdate.version.versionNumber + 1,
                    action: 'M',
                    changes: changes.join(', ')
                });

                templateDataToUpdate.version.versionNumber += 1;
                templateDataToUpdate.version.versionDate = formattedDateTime;
            }

            await templateDataToUpdate.save();

            return res.status(200).json({
                EC: 0,
                message: "Project and TemplateData updated successfully",
                data: { result: project }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating project",
                data: { error: error.message }
            });
        }
    },
    deleteProject: async (req, res) => {
        const { id } = req.params;

        try {
            const project = await Project.findById(id);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            project.status = 'Archive';
            await project.save();

            await project.delete();

            const formattedDateTime = moment().format('MM-DD-YYYY HH:mm:ss');

            const templateData = await TemplateData.findOne({ templateId: project.template });
            if (templateData) {
                templateData.projectData.status = 'Archive';
                templateData.changesLog.push({
                    dateChanged: formattedDateTime,
                    versionDate: moment().format('MM-DD-YYYY'),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project "${project.name}" has been temporarily archived and is now locked.`
                });
                await templateData.save();
            }

            const projectVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateData.version.versionNumber,
                changes: `Project "${project.name}" has been temporarily archived and is now locked.`,
                updatedBy: req.user.id
            });

            await projectVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project archived successfully",
                data: { result: project }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error archiving project",
                data: { error: error.message }
            });
        }
    },
    restoreProject: async (req, res) => {
        const { id } = req.params;

        try {
            const project = await Project.findOneWithDeleted({ _id: id });
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            project.status = 'In Progress';
            await project.save();

            await project.restore();

            const formattedDateTime = moment().format('MM-DD-YYYY HH:mm:ss');

            const templateData = await TemplateData.findOne({ templateId: project.template });
            if (templateData) {
                templateData.projectData.status = 'In Progress';
                templateData.changesLog.push({
                    dateChanged: formattedDateTime,
                    versionDate: moment().format('MM-DD-YYYY'),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project "${project.name}" has been reactivated and is now in progress.`
                });
                await templateData.save();
            }

            const projectVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateData.version.versionNumber,
                changes: `Project "${project.name}" has been reactivated and is now in progress.`,
                updatedBy: req.user.id
            });

            await projectVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project restored successfully",
                data: { result: project }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error restoring project",
                data: { error: error.message }
            });
        }
    },
    getAllProjects: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { includeDeleted } = req.query;
        const sortCriteria = { deleted: 1, createdAt: -1 };

        try {
            const userId = req.user.id;
            const userRole = req.user.role;

            let projects;

            if (userRole === 'Opportunity') {
                if (includeDeleted === 'true') {
                    projects = await Project.findWithDeleted({ createdBy: userId })
                        .populate('category department division template reviewer')
                        .sort(sortCriteria);
                } else {
                    projects = await Project.find({ createdBy: userId })
                        .populate('category department division template reviewer')
                        .sort(sortCriteria);
                }
            } else {
                if (includeDeleted === 'true') {
                    projects = await Project.findWithDeleted()
                        .populate('category department division template reviewer')
                        .sort(sortCriteria);
                } else {
                    projects = await Project.find()
                        .populate('category department division template reviewer')
                        .sort(sortCriteria);
                }
            }

            return res.status(200).json({
                EC: 0,
                message: "Projects fetched successfully",
                data: { result: projects }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching projects",
                data: { error: error.message }
            });
        }
    }
};
