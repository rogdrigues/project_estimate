const ProjectComment = require('../../models/project/projectComment');
const Project = require('../../models/project/project');
const { validationResult } = require('express-validator');
const moment = require('moment');
const ProjectVersion = require('../../models/project/projectVersion');

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

        const { projectId, comment, action, decision } = req.body;

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            const newComment = new ProjectComment({
                project: projectId,
                user: req.user.id,
                comment,
                action,
                decision: decision || 'Pending'
            });

            await newComment.save();

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
        const { comment, isResolved, decision } = req.body;

        try {
            const projectComment = await ProjectComment.findById(id);
            if (!projectComment) {
                return res.status(404).json({
                    EC: 1,
                    message: "Comment not found",
                    data: null
                });
            }

            projectComment.comment = comment || projectComment.comment;
            projectComment.isResolved = isResolved !== undefined ? isResolved : projectComment.isResolved;
            projectComment.decision = decision || projectComment.decision;

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

            await projectComment.delete();

            return res.status(200).json({
                EC: 0,
                message: "Comment deleted successfully",
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

            return res.status(200).json({
                EC: 0,
                message: "Comments fetched successfully",
                data: { result: comments }
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error fetching comments",
                data: { error: error.message }
            });
        }
    },
    approveProject: async (req, res) => {
        const { projectId } = req.params;
        const { comment } = req.body; // optional comment from reviewer

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            if (project.status === 'Completed') {
                return res.status(400).json({
                    EC: 1,
                    message: "Project is already approved",
                    data: null
                });
            }

            // Update project status to Completed
            project.status = 'Completed';
            await project.save();

            // Add approval comment
            const approvalComment = new ProjectComment({
                project: projectId,
                user: req.user.id, // reviewer
                comment: comment || "Project approved by reviewer.",
                action: 'Approval',
                decision: 'Approved',
                isResolved: true
            });

            await approvalComment.save();

            // Log version change
            const newVersion = new ProjectVersion({
                project: project._id,
                versionNumber: project.version ? project.version.versionNumber + 1 : 1,
                changes: 'Project approved by reviewer',
                updatedBy: req.user.id
            });

            await newVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project approved successfully",
                data: {
                    result: project,
                    comment: approvalComment
                }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error approving project",
                data: { error: error.message }
            });
        }
    },

    rejectProject: async (req, res) => {
        const { projectId } = req.params;
        const { comment } = req.body; // optional comment from reviewer

        try {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({
                    EC: 1,
                    message: "Project not found",
                    data: null
                });
            }

            if (project.status === 'Completed') {
                return res.status(400).json({
                    EC: 1,
                    message: "Project is already completed, cannot be rejected",
                    data: null
                });
            }

            // Add rejection comment
            const rejectionComment = new ProjectComment({
                project: projectId,
                user: req.user.id, // reviewer
                comment: comment || "Project rejected by reviewer.",
                action: 'Approval',
                decision: 'Rejected',
                isResolved: true
            });

            await rejectionComment.save();

            // Log version change
            const newVersion = new ProjectVersion({
                project: project._id,
                versionNumber: project.version ? project.version.versionNumber + 1 : 1,
                changes: 'Project rejected by reviewer',
                updatedBy: req.user.id
            });

            await newVersion.save();

            return res.status(200).json({
                EC: 0,
                message: "Project rejected successfully",
                data: {
                    result: project,
                    comment: rejectionComment
                }
            });

        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: "Error rejecting project",
                data: { error: error.message }
            });
        }
    }
};
