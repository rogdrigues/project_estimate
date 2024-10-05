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
const ProjectResource = require('../../models/project/projectResources');
const ProjectChecklist = require('../../models/project/projectChecklist');
const ProjectTechnology = require('../../models/project/projectTechnology');
const ProjectAssumption = require('../../models/project/projectAssumption');
const ProjectProductivity = require('../../models/project/projectProductivity');
const Assumption = require('../../models/assumption');
const Resource = require('../../models/resource');
const Checklist = require('../../models/checklist');
const Technology = require('../../models/technology');
const Productivity = require('../../models/productivity');

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const profileAndRolePopulate = [
    {
        path: 'profile',
        select: 'fullName dateOfBirth gender phoneNumber avatar'
    },
    {
        path: 'role',
        select: 'roleName permissions'
    }
];

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
                lead: req.user.id,
                division: currentUser?.division?._id,
                department: currentUser?.department?._id || null,
            });

            await newProject.save();


            const newTemplateData = new TemplateData({
                templateId: templateData._id,
                projectId: newProject._id,
                projectData: {
                    projectName: newProject.name,
                    customer: opportunityData.customerName,
                    status: newProject.status,
                    division: currentUser?.division?.code || 'N/A',
                    lastModifier: formattedDate
                },
                version: {
                    versionNumber: 1,
                    versionDate: Date.now(),
                    createdBy: req.user.id
                },
                changesLog: [
                    {
                        dateChanged: Date.now(),
                        versionDate: Date.now(),
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

            templateData.templateData.push(newTemplateData._id);
            await templateData.save();


            return res.status(201).json({
                EC: 0,
                message: "Project and TemplateData created successfully",
                data: {
                    result: newProject,
                }
            });

        } catch (error) {
            console.error('Error creating project:', error.message);
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
            const project = await Project.findById(id).populate('category opportunity reviewer template');

            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            const [opportunityData, newTemplateData, reviewerData] = await Promise.all([
                Opportunity.findById(opportunity),
                Template.findById(template._id),
                UserMaster.findById(reviewer).populate('role', 'permissions').select('username')
            ]);

            if (!opportunityData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Opportunity not found",
                    data: null
                });
            }

            if (!newTemplateData) {
                return res.status(404).json({
                    EC: 1,
                    message: "Template not found",
                    data: null
                });
            }

            if (!reviewerData || !reviewerData.role || !reviewerData.role.permissions.includes('project_review')) {
                return res.status(400).json({
                    EC: 1,
                    message: "Invalid reviewer or reviewer does not have 'project_review' permission",
                    data: null
                });
            }

            const changes = [];

            if (project.name !== name) changes.push(`Name changed from "${project.name}" to "${sanitizeString(name)}"`);
            if (project.description !== description) changes.push(`Description changed from "${project.description}" to "${sanitizeString(description)}"`);
            if (project.category._id.toString() !== category.toString()) changes.push(`Category changed from "${project.category.CategoryName}" to "${category.CategoryName}"`);
            if (project.opportunity._id.toString() !== opportunity.toString()) changes.push(`Opportunity changed from "${project.opportunity.name}" to "${opportunityData.name}"`);

            if (project.template._id.toString() !== template._id.toString()) {
                changes.push(`Template changed from "${project.template.name}" to "${newTemplateData.name}"`);

                const oldTemplateData = await TemplateData.findOne({ templateId: project.template._id, projectId: project._id });
                if (oldTemplateData) {
                    oldTemplateData.projectData.status = "Archived";
                    await oldTemplateData.save();
                }

                let existingTemplateData = await TemplateData.findOne({ templateId: newTemplateData._id, projectId: project._id });
                if (!existingTemplateData) {
                    const newTemplateDataInstance = new TemplateData({
                        templateId: newTemplateData._id,
                        projectId: project._id,
                        projectData: {
                            projectName: project.name,
                            customer: opportunityData.customer,
                            status: project.status,
                            division: project.division,
                            lastModifier: Date.now(),
                        },
                        version: {
                            versionNumber: 1,
                            versionDate: Date.now(),
                            createdBy: req.user.id
                        },
                        changesLog: [
                            {
                                dateChanged: Date.now(),
                                versionDate: Date.now(),
                                versionNumber: 1,
                                action: 'A',
                                changes: `Switched from template "${project.template.name}" to "${newTemplateData.name}"`
                            }
                        ]
                    });

                    await newTemplateDataInstance.save();
                    project.template = newTemplateDataInstance._id;
                } else {
                    changes.push(`Switched back to template "${newTemplateData.name}"`);
                    existingTemplateData.projectData.status = project.status;
                    existingTemplateData.projectData.lastModifier = Date.now();
                    existingTemplateData.changesLog.push({
                        dateChanged: Date.now(),
                        versionDate: Date.now(),
                        versionNumber: parseFloat(existingTemplateData.version.versionNumber) + 0.01,
                        action: 'M',
                        changes: `Switched back to template "${newTemplateData.name}"`
                    });
                    await existingTemplateData.save();
                    project.template = existingTemplateData._id;
                }
            }

            if (project.reviewer._id.toString() !== reviewer.toString()) {
                changes.push(`Reviewer changed from "${project.reviewer.username}" to "${reviewerData.username}"`);
                project.reviewer = reviewerData._id;
            }

            project.name = sanitizeString(name) || project.name;
            project.description = sanitizeString(description) || project.description;
            project.category = category || project.category;
            project.opportunity = opportunity || project.opportunity;
            project.status = "In Progress";
            await project.save();

            if (changes.length > 0) {
                const newVersion = new ProjectVersion({
                    project: project._id,
                    versionNumber: project.version ? parseFloat(project.version.versionNumber) + 1 : 1,
                    changes: changes.join(', '),
                    updatedBy: req.user.id
                });

                await newVersion.save();
            }

            const templateDataToUpdate = await TemplateData.findOne({ templateId: project.template, projectId: project._id });
            templateDataToUpdate.projectData.projectName = project.name;
            templateDataToUpdate.projectData.customer = opportunityData.customer;
            templateDataToUpdate.projectData.status = project.status;
            templateDataToUpdate.projectData.lastModifier = Date.now();

            if (changes.length > 0) {
                templateDataToUpdate.changesLog.push({
                    dateChanged: Date.now(),
                    versionDate: Date.now(),
                    versionNumber: parseFloat(templateDataToUpdate.version.versionNumber) + 0.01,
                    action: 'M',
                    changes: changes.join(', ')
                });

                templateDataToUpdate.version.versionNumber = parseFloat(templateDataToUpdate.version.versionNumber) + 0.01;
                templateDataToUpdate.version.versionDate = Date.now();
            }

            await templateDataToUpdate.save();

            return res.status(200).json({
                EC: 0,
                message: "Project and TemplateData updated successfully",
                data: { result: project }
            });

        } catch (error) {
            //Need to know which line causing error
            console.error('Error updating project:', error);
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
            const project = await Project.findById(id).populate('template');

            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            project.status = 'Archived';
            await project.save();

            const templateData = await TemplateData.findOne({ templateId: project.template._id, projectId: project._id });
            if (templateData) {
                templateData.projectData.status = 'Archived';
                templateData.changesLog.push({
                    dateChanged: Date.now(),
                    versionDate: Date.now(),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project "${project.name}" has been archived.`
                });
                await templateData.save();
            }

            await project.delete();

            const projectVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateData ? templateData.version.versionNumber : 1,
                changes: `Project "${project.name}" has been archived.`,
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
            const project = await Project.findOneWithDeleted({ _id: id }).populate('template');
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

            const templateData = await TemplateData.findOne({ templateId: project.template._id, projectId: project._id });
            if (templateData) {
                templateData.projectData.status = 'In Progress';
                templateData.changesLog.push({
                    dateChanged: Date.now(),
                    versionDate: Date.now(),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project "${project.name}" has been restored and is now in progress.`
                });
                await templateData.save();
            }

            const projectVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateData ? templateData.version.versionNumber : 1,
                changes: `Project "${project.name}" has been restored and is now in progress.`,
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

        const { includeDeleted, applyReviewer = false } = req.query;

        try {
            const userId = req.user.id;
            const user = await UserMaster.findById(userId).populate('role');
            const userRole = user.role.roleName;

            let projects;

            if (applyReviewer === 'true') {
                const sortCriteria = { status: 1, createdAt: -1 };

                if (includeDeleted === 'true') {
                    projects = await Project.findWithDeleted({
                        reviewer: userId,
                        status: { $nin: ['Pending', 'In Progress', 'Archive'] }
                    })
                        .populate('category opportunity lead reviewer template')
                        .sort(sortCriteria);
                } else {
                    projects = await Project.find({
                        reviewer: userId,
                        status: { $nin: ['Pending', 'In Progress', 'Archive'] }
                    })
                        .populate('category opportunity lead reviewer template')
                        .sort(sortCriteria);
                }
            }
            else {
                const sortCriteria = { deleted: 1, createdAt: -1 };

                if (userRole === 'Opportunity') {
                    if (includeDeleted === 'true') {
                        projects = await Project.findWithDeleted({ lead: userId })
                            .populate('category opportunity lead reviewer template')
                            .sort(sortCriteria);
                    } else {
                        projects = await Project.find({ lead: userId })
                            .populate('category opportunity lead reviewer template')
                            .sort(sortCriteria);
                    }
                } else {
                    if (includeDeleted === 'true') {
                        projects = await Project.findWithDeleted()
                            .populate('category opportunity lead reviewer template')
                            .sort(sortCriteria);
                    } else {
                        projects = await Project.find()
                            .populate('category opportunity lead reviewer template')
                            .sort(sortCriteria);
                    }
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
    },

    getProjectById: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId)
                .populate('category opportunity division template')
                .populate({
                    path: 'reviewer',
                    populate: profileAndRolePopulate
                })
                .populate({
                    path: 'lead',
                    populate: profileAndRolePopulate
                });

            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Project details fetched successfully",
                data: { result: project }
            });

        } catch (error) {
            console.log('Error fetching project details:', error.message);
            return res.status(500).json({
                EC: 1,
                message: "Error fetching project details",
                data: { error: error.message }
            });
        }
    },
    getReviewers: async (req, res) => {
        try {
            const users = await UserMaster.find()
                .populate('role')
                .exec();

            const reviewers = users.filter(user => {
                return user.role && user.role.permissions.includes('project_review');
            });

            if (!reviewers || reviewers.length === 0) {
                return res.status(404).json({
                    EC: 1,
                    message: "No reviewers found",
                    data: null
                });
            }

            return res.status(200).json({
                EC: 0,
                message: "Reviewers fetched successfully",
                data: { result: reviewers }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching reviewers",
                data: { error: error.message }
            });
        }
    },
    ///////////////////
    updateProjectComponents: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { id } = req.params;
        const { resources, checklists, technologies, assumptions, productivity } = req.body;

        try {
            const project = await Project.findById(id).populate('resources checklists technologies assumptions productivity template').exec();

            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            const changes = [];

            if (assumptions) {

                const newAssumptionIds = assumptions.map(a => a);
                const oldAssumptionIds = project.assumptions.map(a => a.originalAssumptionId.toString());

                const addedAssumptionIds = newAssumptionIds.filter(id => !oldAssumptionIds.includes(id));
                const removedAssumptionIds = oldAssumptionIds.filter(id => !newAssumptionIds.includes(id));

                if (newAssumptionIds.length === 0 && oldAssumptionIds.length > 0) {
                    const removedAssumptions = await Assumption.find({ _id: { $in: oldAssumptionIds } });

                    await ProjectAssumption.deleteMany({ project: project._id });

                    project.assumptions = [];

                    const removedAssumptionNames = removedAssumptions.map(a => a.title).join(', ');
                    changes.push(`Removed all assumptions: ${removedAssumptionNames}`);
                }

                if (addedAssumptionIds.length) {
                    const addedAssumptions = await Assumption.find({ _id: { $in: addedAssumptionIds } });

                    const newProjectAssumptions = await ProjectAssumption.insertMany(
                        addedAssumptions.map(a => ({
                            project: project._id,
                            title: a.title,
                            content: a.content,
                            category: a.category?._id,
                            originalAssumptionId: a._id
                        }))
                    );

                    const newProjectAssumptionIds = newProjectAssumptions.map(pa => pa._id);
                    project.assumptions.push(...newProjectAssumptionIds);

                    const addedAssumptionNames = addedAssumptions.map(a => a.title).join(', ');
                    changes.push(`Added ${addedAssumptionIds.length} new assumptions: ${addedAssumptionNames}`);
                }

                if (removedAssumptionIds.length) {
                    const removedAssumptions = await Assumption.find({ _id: { $in: removedAssumptionIds } });

                    await ProjectAssumption.deleteMany({ project: project._id, originalAssumptionId: { $in: removedAssumptionIds } });

                    project.assumptions = project.assumptions.filter(a => !removedAssumptionIds.includes(a.toString()));

                    const removedAssumptionNames = removedAssumptions.map(a => a.title).join(', ');
                    changes.push(`Removed ${removedAssumptionIds.length} assumptions: ${removedAssumptionNames}`);
                }
            }

            // Handle Resources
            if (resources) {

                const newResourceIds = resources.map(r => r);
                const oldResourceIds = project.resources.map(r => r.originalResourceId.toString());

                const addedResourceIds = newResourceIds.filter(id => !oldResourceIds.includes(id));
                const removedResourceIds = oldResourceIds.filter(id => !newResourceIds.includes(id));

                if (newResourceIds.length === 0 && oldResourceIds.length > 0) {
                    const removedResources = await Resource.find({ _id: { $in: oldResourceIds } });

                    await ProjectResource.deleteMany({ project: project._id });

                    project.resources = [];

                    const removedResourceNames = removedResources.map(r => r.name).join(', ');
                    changes.push(`Removed all resources: ${removedResourceNames}`);
                }

                if (addedResourceIds.length) {
                    const addedResources = await Resource.find({ _id: { $in: addedResourceIds } });

                    const newProjectResources = await ProjectResource.insertMany(
                        addedResources.map(r => ({
                            project: project._id,
                            name: r.name,
                            unitPrice: r.unitPrice,
                            location: r.location,
                            level: r.level,
                            currency: r.currency,
                            conversionRate: r.conversionRate,
                            originalResourceId: r._id
                        }))
                    );

                    const newProjectResourceIds = newProjectResources.map(pr => pr._id);
                    project.resources.push(...newProjectResourceIds);

                    const addedResourceNames = addedResources.map(r => r.name).join(', ');
                    changes.push(`Added ${addedResourceIds.length} new resources: ${addedResourceNames}`);
                }

                if (removedResourceIds.length) {
                    const removedResources = await Resource.find({ _id: { $in: removedResourceIds } });

                    await ProjectResource.deleteMany({ project: project._id, originalResourceId: { $in: removedResourceIds } });

                    project.resources = project.resources.filter(r => !removedResourceIds.includes(r.toString()));

                    const removedResourceNames = removedResources.map(r => r.name).join(', ');
                    changes.push(`Removed ${removedResourceIds.length} resources: ${removedResourceNames}`);
                }
            }

            if (checklists) {
                const newChecklistIds = checklists.map(c => c);
                const oldChecklistIds = project.checklists.map(c => c.originalChecklistId.toString());

                const addedChecklistIds = newChecklistIds.filter(id => !oldChecklistIds.includes(id));
                const removedChecklistIds = oldChecklistIds.filter(id => !newChecklistIds.includes(id));

                if (newChecklistIds.length === 0 && oldChecklistIds.length > 0) {
                    const removedChecklists = await Checklist.find({ _id: { $in: oldChecklistIds } });

                    await ProjectChecklist.deleteMany({ project: project._id });

                    project.checklists = [];

                    const removedChecklistNames = removedChecklists.map(c => c.name).join(', ');
                    changes.push(`Removed all checklists: ${removedChecklistNames}`);
                }

                if (addedChecklistIds.length) {
                    const addedChecklists = await Checklist.find({ _id: { $in: addedChecklistIds } });

                    const newProjectChecklists = await ProjectChecklist.insertMany(
                        addedChecklists.map(c => ({
                            project: project._id,
                            name: c.name,
                            category: c.category?._id,
                            parentID: c.parentID,
                            subClass: c.subClass,
                            description: c.description,
                            note: c.note,
                            assessment: c.assessment,
                            priority: c.priority,
                            originalChecklistId: c._id
                        }))
                    );

                    const newProjectChecklistIds = newProjectChecklists.map(pc => pc._id);
                    project.checklists.push(...newProjectChecklistIds);

                    const addedChecklistNames = addedChecklists.map(c => c.name).join(', ');
                    changes.push(`Added ${addedChecklistIds.length} new checklists: ${addedChecklistNames}`);
                }

                if (removedChecklistIds.length) {
                    const removedChecklists = await Checklist.find({ _id: { $in: removedChecklistIds } });

                    await ProjectChecklist.deleteMany({ project: project._id, originalChecklistId: { $in: removedChecklistIds } });

                    project.checklists = project.checklists.filter(c => !removedChecklistIds.includes(c.toString()));

                    const removedChecklistNames = removedChecklists.map(c => c.name).join(', ');
                    changes.push(`Removed ${removedChecklistIds.length} checklists: ${removedChecklistNames}`);
                }
            }


            // Handle Technologies
            if (technologies) {
                const newTechnologyIds = technologies.map(t => t);
                const oldTechnologyIds = project.technologies.map(t => t.originalTechId.toString());

                const addedTechnologyIds = newTechnologyIds.filter(id => !oldTechnologyIds.includes(id));
                const removedTechnologyIds = oldTechnologyIds.filter(id => !newTechnologyIds.includes(id));

                if (newTechnologyIds.length === 0 && oldTechnologyIds.length > 0) {
                    const removedTechnologies = await Technology.find({ _id: { $in: oldTechnologyIds } });

                    await ProjectTechnology.deleteMany({ project: project._id });

                    project.technologies = [];

                    const removedTechnologyNames = removedTechnologies.map(t => t.name).join(', ');
                    changes.push(`Removed all technologies: ${removedTechnologyNames}`);
                }

                if (addedTechnologyIds.length) {
                    const addedTechnologies = await Technology.find({ _id: { $in: addedTechnologyIds } });

                    const newProjectTechnologies = await ProjectTechnology.insertMany(
                        addedTechnologies.map(t => ({
                            project: project._id,
                            name: t.name,
                            version: t.version,
                            category: t.category,
                            standard: t.standard,
                            originalTechId: t._id
                        }))
                    );

                    const newProjectTechnologyIds = newProjectTechnologies.map(pt => pt._id);
                    project.technologies.push(...newProjectTechnologyIds);

                    const addedTechnologyNames = addedTechnologies.map(t => t.name).join(', ');
                    changes.push(`Added ${addedTechnologyIds.length} new technologies: ${addedTechnologyNames}`);
                }

                if (removedTechnologyIds.length) {
                    const removedTechnologies = await Technology.find({ _id: { $in: removedTechnologyIds } });

                    await ProjectTechnology.deleteMany({ project: project._id, originalTechId: { $in: removedTechnologyIds } });

                    project.technologies = project.technologies.filter(t => !removedTechnologyIds.includes(t.toString()));

                    const removedTechnologyNames = removedTechnologies.map(t => t.name).join(', ');
                    changes.push(`Removed ${removedTechnologyIds.length} technologies: ${removedTechnologyNames}`);
                }
            }


            // Handle Productivity
            if (productivity) {
                const newProductivityIds = productivity.map(p => p);
                const oldProductivityIds = project.productivity.map(p => p.originalProductivityId.toString());

                const addedProductivityIds = newProductivityIds.filter(id => !oldProductivityIds.includes(id));
                const removedProductivityIds = oldProductivityIds.filter(id => !newProductivityIds.includes(id));

                if (newProductivityIds.length === 0 && oldProductivityIds.length > 0) {
                    const removedProductivity = await Productivity.find({ _id: { $in: oldProductivityIds } });

                    await ProjectProductivity.deleteMany({ project: project._id });

                    project.productivity = [];

                    const removedProductivityNames = removedProductivity.map(p => p.name).join(', ');
                    changes.push(`Removed all productivity items: ${removedProductivityNames}`);
                }

                if (addedProductivityIds.length) {
                    const addedProductivity = await Productivity.find({ _id: { $in: addedProductivityIds } });

                    const newProjectProductivity = await ProjectProductivity.insertMany(
                        addedProductivity.map(p => ({
                            project: project._id,
                            productivity: p.productivity,
                            technology: p.technology?._id,
                            norm: p.norm,
                            unit: p.unit,
                            originalProductivityId: p._id
                        }))
                    );

                    const newProjectProductivityIds = newProjectProductivity.map(pp => pp._id);
                    project.productivity.push(...newProjectProductivityIds);

                    const addedProductivityNames = addedProductivity.map(p => p.name).join(', ');
                    changes.push(`Added ${addedProductivityIds.length} new productivity items: ${addedProductivityNames}`);
                }

                if (removedProductivityIds.length) {
                    const removedProductivity = await Productivity.find({ _id: { $in: removedProductivityIds } });

                    await ProjectProductivity.deleteMany({ project: project._id, originalProductivityId: { $in: removedProductivityIds } });

                    project.productivity = project.productivity.filter(p => !removedProductivityIds.includes(p.toString()));

                    const removedProductivityNames = removedProductivity.map(p => p.name).join(', ');
                    changes.push(`Removed ${removedProductivityIds.length} productivity items: ${removedProductivityNames}`);
                }
            }


            if (changes.length === 0) {
                return res.status(400).json({
                    EC: 1,
                    message: "No changes provided",
                    data: null
                });
            }

            await project.save();

            // Update templateData version
            const templateDataToUpdate = await TemplateData.findOne({ templateId: project.template._id, projectId: project._id });
            templateDataToUpdate.version.versionNumber = parseFloat(templateDataToUpdate.version.versionNumber) + 0.01;

            templateDataToUpdate.changesLog.push({
                dateChanged: Date.now(),
                versionDate: Date.now(),
                versionNumber: templateDataToUpdate.version.versionNumber,
                action: 'M',
                changes: changes.join(', ')
            });

            await templateDataToUpdate.save();

            // Update project version log
            const newVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateDataToUpdate.version.versionNumber,
                changes: changes.join(', '),
                updatedBy: req.user.id
            });

            await newVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project components updated successfully",
                data: { result: project }
            });

        } catch (error) {
            console.log('Error updating project components:', error.message);
            return res.status(500).json({
                EC: 1,
                message: "Error updating project components",
                data: { error: error.message }
            });
        }
    },

    getProjectComponents: async (req, res) => {
        const { projectId } = req.params;
        const { componentType } = req.query;

        try {
            const validComponents = ['resources', 'checklists', 'technologies', 'assumptions', 'productivity'];

            if (!validComponents.includes(componentType)) {
                return res.status(400).json({
                    EC: 1,
                    message: "Invalid component type",
                    data: null
                });
            }

            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            let componentData;

            switch (componentType) {
                case 'resources':
                    componentData = await ProjectResource.find({ project: projectId });
                    break;
                case 'checklists':
                    componentData = await ProjectChecklist.find({ project: projectId }).populate('category');
                    break;
                case 'technologies':
                    componentData = await ProjectTechnology.find({ project: projectId });
                    break;
                case 'assumptions':
                    componentData = await ProjectAssumption.find({ project: projectId }).populate('category');
                    break;
                case 'productivity':
                    componentData = await ProjectProductivity.find({ project: projectId }).populate('technology');
                    break;
                default:
                    return res.status(400).json({
                        EC: 1,
                        message: "Invalid component type",
                        data: null
                    });
            }

            return res.status(200).json({
                EC: 0,
                message: `${componentType.charAt(0).toUpperCase() + componentType.slice(1)} fetched successfully`,
                data: {
                    result: componentData
                }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: `Error fetching ${componentType}`,
                data: { error: error.message }
            });
        }
    },

    //Update project components after selecting
    updateProjectAssumption: async (req, res) => {
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

        const { id } = req.params;
        const { title, content, category } = req.body;

        try {
            const assumption = await ProjectAssumption.findById(id);
            if (!assumption) {
                return res.status(404).json({
                    EC: 1,
                    message: "Assumption not found",
                    data: {
                        result: null
                    }
                });
            }

            assumption.title = title || assumption.title;
            assumption.content = content || assumption.content;
            assumption.category = category || assumption.category;

            await assumption.save();

            return res.status(200).json({
                EC: 0,
                message: "Project Assumption updated successfully",
                data: {
                    result: assumption
                }
            });
        } catch (error) {
            console.log('Error updating project assumption:', error.message);
            return res.status(500).json({
                EC: 1,
                message: "Error updating project assumption",
                data: {
                    result: null,
                    error: error.message
                }
            });
        }
    },

    updateProjectChecklist: async (req, res) => {
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

        const { id } = req.params;
        const { name, description, category, subClass, note, assessment, priority } = req.body;

        try {
            const checklist = await ProjectChecklist.findById(id);
            if (!checklist) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Checklist not found',
                    data: { result: null }
                });
            }

            const existingSubClasses = await ProjectChecklist.find({ category });

            let parentID = checklist.parentID;

            if (!existingSubClasses.length) {
                parentID = 1;
            } else {
                const existingSubClass = existingSubClasses.find(cl => cl.subClass === subClass);

                if (existingSubClass) {
                    parentID = existingSubClass.parentID;
                } else {
                    const maxParentId = Math.max(...existingSubClasses.map(cl => cl.parentID));
                    parentID = maxParentId + 1;
                }
            }

            checklist.name = sanitizeString(name) || checklist.name;
            checklist.description = sanitizeString(description) || checklist.description;
            checklist.category = category || checklist.category;
            checklist.subClass = sanitizeString(subClass) || checklist.subClass;
            checklist.note = note || checklist.note;
            checklist.assessment = assessment || checklist.assessment;
            checklist.priority = priority || checklist.priority;
            checklist.parentID = parentID;

            await checklist.save();

            return res.status(200).json({
                EC: 0,
                message: 'Project Checklist updated successfully',
                data: checklist
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating project checklist',
                data: { error: error.message }
            });
        }
    },

    updateProjectResource: async (req, res) => {
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

        const { id } = req.params;
        let { name, unitPrice, location, currency, level } = req.body;

        try {
            const resource = await ProjectResource.findById(id);
            if (!resource) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Resource not found',
                    data: { result: null }
                });
            }

            const sanitizedName = name ? sanitizeString(name) : resource.name;
            const sanitizedLocation = location ? sanitizeString(location) : resource.location;

            let conversionRate = resource.conversionRate;
            if (currency && currency !== resource.currency) {
                conversionRate = await getConversionRate(currency);
            }

            resource.name = sanitizedName;
            resource.unitPrice = unitPrice || resource.unitPrice;
            resource.location = sanitizedLocation;
            resource.level = level || resource.level;
            resource.currency = currency || resource.currency;
            resource.conversionRate = conversionRate;

            await resource.save();

            return res.status(200).json({
                EC: 0,
                message: 'Project Resource updated successfully',
                data: resource
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating project resource',
                data: { error: error.message }
            });
        }
    },

    updateProjectTechnology: async (req, res) => {
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

        const { id } = req.params;
        const { name, standard, version, category } = req.body;

        try {
            const technology = await ProjectTechnology.findById(id);
            if (!technology) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Project Technology not found',
                    data: { result: null }
                });
            }

            technology.name = name || technology.name;
            technology.standard = standard || technology.standard;
            technology.version = version || technology.version;
            technology.category = category || technology.category;

            await technology.save();

            return res.status(200).json({
                EC: 0,
                message: 'Project Technology updated successfully',
                data: technology
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating project technology',
                data: { error: error.message }
            });
        }
    },

    updateProjectProductivity: async (req, res) => {
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

        const { id } = req.params;
        const { productivity, technology, norm, unit } = req.body;

        try {
            const prod = await ProjectProductivity.findById(id);
            if (!prod) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Productivity not found',
                    data: { result: null }
                });
            }


            const sanitizedNorm = sanitizeString(norm);
            const sanitizedUnit = sanitizeString(unit);

            prod.productivity = productivity || prod.productivity;
            prod.technology = technology._id || prod.technology._id;
            prod.norm = sanitizedNorm || prod.norm;
            prod.unit = sanitizedUnit || prod.unit;

            await prod.save();

            return res.status(200).json({
                EC: 0,
                message: 'Project Productivity updated successfully',
                data: prod
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error updating project productivity',
                data: { error: error.message }
            });
        }
    },

    ///Excel handler (fix later)

    generateExcelFile: async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId)
                .populate('division lead opportunity');
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Project not found',
                    data: null
                });
            }

            const templateData = await TemplateData.findOne({ templateId: project.template })
                .populate('templateId createdBy');
            if (!templateData) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Template data not found',
                    data: null
                });
            }

            const templateFilePath = path.join(__dirname, templateData.filePath);
            if (!fs.existsSync(templateFilePath)) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Template file not found',
                    data: null
                });
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(templateFilePath);

            const coverSheet = workbook.getWorksheet('Cover');
            if (!coverSheet) {
                return res.status(400).json({
                    EC: 1,
                    message: 'Cover sheet is missing',
                    data: null
                });
            }

            this.processCoverSheet(workbook, templateData);
            this.processLogsChangeSheet(workbook, templateData);
            //this.processSummarySheet(workbook, templateData);

            const buffer = await workbook.xlsx.writeBuffer();

            const date = new Date();
            const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, '');
            const fileName = `Project_Report_${templateData.projectData.projectName || 'N/A'}_${formattedDate}.xlsx`;

            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            return res.send(buffer);

        } catch (error) {
            console.error('Error generating Excel file:', error);
            return res.status(500).json({
                EC: 1,
                message: 'Error generating Excel file',
                data: { error: error.message }
            });
        }
    },

    processCoverSheet: (workbook, templateData) => {
        const coverSheet = workbook.getWorksheet('Cover');
        coverSheet.getCell('C2').value = `${templateData?.projectData?.projectName || 'Project Unnamed'}`;
        coverSheet.getCell('D3').value = `${templateData?.version?.versionNumber || 'N/A'}`;
        coverSheet.getCell('D4').value = `${templateData?.projectData?.customer || 'N/A'}`;
        coverSheet.getCell('D5').value = `${templateData?.projectData?.status || 'N/A'}`;
        coverSheet.getCell('D6').value = `${templateData?.version?.versionDate || 'N/A'}`;
        coverSheet.getCell('D7').value = `${templateData?.projectData?.lastModifier || 'N/A'}`;
        coverSheet.getCell('D8').value = `${templateData?.projectData?.division || 'N/A'}`;
        coverSheet.getCell('D9').value = `${templateData?.version?.createdBy?.username || 'N/A'}`;
    },

    processLogsChangeSheet: (workbook, templateData) => {
        const logsSheet = workbook.getWorksheet('Change logs');

        if (!logsSheet) {
            throw new Error('Logs Change sheet is missing');
        }

        const logs = templateData.changesLog;

        let startRow = 4;

        logs.forEach((log) => {
            const currentRow = logsSheet.insertRow(startRow++, [
                log.dateChanged || 'N/A',
                log.versionDate || 'N/A',
                log.versionNumber || 'N/A',
                log.action || 'N/A',
                log.changesDescription || 'N/A'
            ]);

            ['B', 'C', 'D', 'E', 'F'].forEach(col => {
                const cell = currentRow.getCell(col);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            currentRow.commit();
        });
    },

    processSummarySheet: (workbook, templateData) => {
        // Handle later if needed
    }
};
