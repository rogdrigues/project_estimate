const ProjectComment = require('../../models/project/projectComment');
const Project = require('../../models/project/project');
const { validationResult } = require('express-validator');
const moment = require('moment');
const ProjectVersion = require('../../models/project/projectVersion');
const TemplateData = require('../../models/template/templateData');
const UserMaster = require('../../models/userMaster');

module.exports = {
    addComment: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: "Validation failed",
                data: { errors: errors.array() }
            });
        }

        const { projectId, comment, action = 'Chat', decision, parentComment } = req.body;

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            if (project.status === 'Completed' || project.status === 'Rejected') {
                return res.status(400).json({
                    EC: 1,
                    message: `Cannot add comment, the project is already ${project.status.toLowerCase()}.`,
                    data: null
                });
            }

            const user = await UserMaster.findById(req.user.id).populate('role');
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: null
                });
            }

            const userRole = user.role.roleName;

            let parentCommentObj = null;
            if (parentComment) {
                parentCommentObj = await ProjectComment.findById(parentComment);
                if (!parentCommentObj) {
                    return res.status(404).json({
                        EC: 1,
                        message: "Parent comment not found",
                        data: null
                    });
                }
            }

            if (action === 'Approval' || action === 'Rejected') {
                if (!decision || !['Approved', 'Rejected'].includes(decision)) {
                    return res.status(400).json({
                        EC: 1,
                        message: "Approval or Rejection action requires a valid decision (Approved or Rejected)",
                        data: null
                    });
                }
            }

            const newCommentData = {
                project: projectId,
                user: req.user.id,
                comment,
                action,
                parentComment: parentCommentObj ? parentCommentObj._id : null,
                role: userRole
            };

            if (action !== 'Chat') {
                newCommentData.decision = decision || 'Pending';
            }

            const newComment = new ProjectComment(newCommentData);
            await newComment.save();

            if (action === 'Approval' || action === 'Rejected') {
                project.status = decision === 'Approved' ? 'Completed' : 'Rejected';
                await project.save();

                const templateData = await TemplateData.findOne({ templateId: project.template });
                if (templateData) {
                    const versionChange = decision === 'Approved' ? 1 : 0.1;
                    templateData.version.versionNumber += versionChange;
                    templateData.projectData.status = project.status;
                    templateData.projectData.lastModifier = Date.now();
                    templateData.changesLog.push({
                        dateChanged: Date.now(),
                        versionDate: Date.now(),
                        versionNumber: templateData.version.versionNumber,
                        action: 'M',
                        changes: `Project ${decision === 'Approved' ? 'approved' : 'rejected'} by ${user.username}`
                    });
                    await templateData.save();
                }

                const newVersion = new ProjectVersion({
                    project: project._id,
                    versionNumber: templateData.version.versionNumber,
                    changes: `Project ${decision === 'Approved' ? 'approved' : 'rejected'} by ${user.username}`,
                    updatedBy: req.user.id
                });
                await newVersion.save();
            }

            return res.status(201).json({
                EC: 0,
                message: "Comment added successfully",
                data: { result: newComment }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error adding comment",
                data: { error: error.message }
            });
        }
    },

    updateComment: async (req, res) => {
        const { id } = req.params;
        const { comment } = req.body;

        try {
            const projectComment = await ProjectComment.findById(id);
            if (!projectComment) {
                return res.status(404).json({
                    EC: 1,
                    message: "Comment not found",
                    data: null
                });
            }

            if (projectComment.user.toString() !== req.user.id) {
                return res.status(403).json({
                    EC: 1,
                    message: "You do not have permission to edit this comment",
                    data: null
                });
            }

            projectComment.comment = comment || projectComment.comment;

            await projectComment.save();

            return res.status(200).json({
                EC: 0,
                message: "Comment updated successfully",
                data: { result: projectComment }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error updating comment",
                data: { error: error.message }
            });
        }
    },


    deleteComment: async (req, res) => {
        const { id } = req.params;

        try {
            const projectComment = await ProjectComment.findById(id);
            if (!projectComment) {
                return res.status(404).json({
                    EC: 1,
                    message: "Comment not found",
                    data: null
                });
            }

            if (projectComment.user.toString() !== req.user.id) {
                const user = await UserMaster.findById(req.user.id).populate('role');
                if (!user || !user.role.permissions.includes('admin') && !user.role.permissions.includes('project_review')) {
                    return res.status(403).json({
                        EC: 1,
                        message: "You do not have permission to delete this comment",
                        data: null
                    });
                }
            }

            await projectComment.delete();

            return res.status(200).json({
                EC: 0,
                message: "Comment marked as deleted",
                data: { result: projectComment }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error deleting comment",
                data: { error: error.message }
            });
        }
    },


    getCommentsByProject: async (req, res) => {
        const { projectId } = req.params;

        try {
            const comments = await ProjectComment.find({ project: projectId })
                .populate('user', 'username')
                .sort({ createdAt: -1 })
                .exec();

            if (!comments.length) {
                return res.status(404).json({
                    EC: 1,
                    message: "No comments found for this project",
                    data: null
                });
            }

            const formattedComments = comments.map(comment => {
                if (comment.deleted) {
                    return {
                        ...comment.toObject(),
                        comment: 'This comment has been deleted'
                    };
                }
                return comment;
            });

            return res.status(200).json({
                EC: 0,
                message: "Comments fetched successfully",
                data: { result: formattedComments }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching comments",
                data: { error: error.message }
            });
        }
    },

    startReviewProcess: async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId).populate('reviewer');

            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            if (project.status === 'Completed' || project.status === 'Rejected') {
                return res.status(400).json({
                    EC: 1,
                    message: `Cannot start review process, the project is already ${project.status.toLowerCase()}.`,
                    data: null
                });
            }

            if (project.status !== 'Pending' && project.status !== 'In Progress') {
                return res.status(400).json({
                    EC: 1,
                    message: "The project must be in 'Pending' or 'In Progress' to start the review process.",
                    data: null
                });
            }

            project.status = 'In Review';
            await project.save();

            const newVersion = new ProjectVersion({
                project: project._id,
                versionNumber: project.version ? project.version.versionNumber : 1,
                changes: `Project moved to 'In Review' status by ${req.user.username}`,
                updatedBy: req.user.id
            });

            await newVersion.save();

            const templateData = await TemplateData.findOne({ templateId: project.template });
            if (templateData) {
                templateData.projectData.status = 'In Review'; i
                templateData.projectData.lastModifier = Date.now();
                templateData.changesLog.push({
                    dateChanged: Date.now(),
                    versionDate: Date.now(),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project moved to 'In Review' status by ${req.user.username}`
                });

                await templateData.save();
            }

            return res.status(200).json({
                EC: 0,
                message: "Review process started successfully",
                data: { result: project }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error starting review process",
                data: { error: error.message }
            });
        }
    },
    requestReview: async (req, res) => {
        const { projectId } = req.params;

        try {
            const project = await Project.findById(projectId).populate('reviewer', 'username');
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            if (project.status !== 'Rejected') {
                return res.status(400).json({
                    EC: 1,
                    message: "You can only request a review if the project is rejected.",
                    data: null
                });
            }

            const user = await UserMaster.findById(req.user.id).populate('role');
            if (!user) {
                return res.status(404).json({
                    EC: 1,
                    message: "User not found",
                    data: null
                });
            }

            project.status = 'In Review';
            await project.save();

            const templateData = await TemplateData.findOne({ templateId: project.template });
            if (templateData) {
                const versionChange = 0.1;
                templateData.version.versionNumber += versionChange;
                templateData.projectData.status = project.status;
                templateData.projectData.lastModifier = Date.now();
                templateData.changesLog.push({
                    dateChanged: Date.now(),
                    versionDate: Date.now(),
                    versionNumber: templateData.version.versionNumber,
                    action: 'M',
                    changes: `Project sent for re-review by ${user.username}, assigned to reviewer ${project.reviewer.username}`
                });
                await templateData.save();
            }

            const newVersion = new ProjectVersion({
                project: project._id,
                versionNumber: templateData ? templateData.version.versionNumber : 1,
                changes: `Project sent for re-review by ${user.username}, assigned to reviewer ${project.reviewer.username}`,
                updatedBy: req.user.id
            });
            await newVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project sent for re-review successfully",
                data: { result: project }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error sending project for re-review",
                data: { error: error.message }
            });
        }
    }
};
