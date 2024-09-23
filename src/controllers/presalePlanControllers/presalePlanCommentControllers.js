const PresalePlanComment = require('../../models/opportunity/presalePlanComments');
const PresalePlan = require('../../models/opportunity/presalePlan');
const Opportunity = require('../../models/opportunity/presaleOpportunity');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../../utils/stringUtils');

module.exports = {
    createComment: async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                EC: 1,
                message: 'Validation failed',
                data: { errors: errors.array() }
            });
        }

        const { presalePlan, comment, approvalStatus } = req.body;
        const userId = req.user._id;

        try {
            const existingComment = await PresalePlanComment.findOne({ presalePlan, createdBy: userId });
            if (existingComment) {
                return res.status(400).json({
                    EC: 1,
                    message: 'You have already commented on this presale plan',
                    data: null
                });
            }

            const newComment = new PresalePlanComment({
                presalePlan,
                comment: sanitizeString(comment),
                approvalStatus,
                createdBy: userId
            });

            await newComment.save();

            const allComments = await PresalePlanComment.find({ presalePlan }).exec();
            const approvedCount = allComments.filter(c => c.approvalStatus === 'Approved').length;
            const rejectedCount = allComments.filter(c => c.approvalStatus === 'Rejected').length;

            const presalePlanData = await PresalePlan.findById(presalePlan);

            if (approvedCount >= 10) {
                presalePlanData.status = 'Approved';

                const opportunity = await Opportunity.findById(presalePlanData.opportunity);
                if (opportunity) {
                    opportunity.presalePlan = presalePlanData._id;
                    await opportunity.save();
                }
            } else if (rejectedCount >= 10) {
                presalePlanData.status = 'Rejected';
            }

            await presalePlanData.save();

            return res.status(201).json({
                EC: 0,
                message: 'Comment added and status updated successfully',
                data: newComment
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error adding comment',
                data: { error: error.message }
            });
        }
    },

    getCommentsForPresalePlan: async (req, res) => {
        const { presalePlanId } = req.params;

        try {
            const comments = await PresalePlanComment.find({ presalePlan: presalePlanId })
                .populate('createdBy', 'fullName email')
                .exec();

            return res.status(200).json({
                EC: 0,
                message: 'Comments fetched successfully',
                data: comments
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error fetching comments',
                data: { error: error.message }
            });
        }
    },

    approvePresalePlan: async (req, res) => {
        const { id } = req.params;
        const userId = req.user._id;

        try {
            const presalePlan = await PresalePlan.findById(id);

            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            if (presalePlan.approvedBy.includes(userId)) {
                return res.status(400).json({
                    EC: 1,
                    message: 'You have already approved this presale plan',
                    data: null
                });
            }

            presalePlan.approvedBy.push(userId);
            presalePlan.approvalCount += 1;

            if (presalePlan.approvalCount >= 10) {
                presalePlan.status = 'Approved';

                const opportunity = await Opportunity.findById(presalePlan.opportunity);
                if (opportunity) {
                    opportunity.presalePlan = presalePlan._id;
                    await opportunity.save();
                }
            }

            await presalePlan.save();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan approved successfully',
                data: presalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error approving presale plan',
                data: { error: error.message }
            });
        }
    },

    rejectPresalePlan: async (req, res) => {
        const { id } = req.params;
        const { reason } = req.body;

        try {
            const presalePlan = await PresalePlan.findById(id);

            if (!presalePlan) {
                return res.status(404).json({
                    EC: 1,
                    message: 'Presale Plan not found',
                    data: null
                });
            }

            presalePlan.status = 'Rejected';
            presalePlan.rejectionReason = sanitizeString(reason) || 'No reason provided';

            await presalePlan.save();

            return res.status(200).json({
                EC: 0,
                message: 'Presale Plan rejected successfully',
                data: presalePlan
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error rejecting presale plan',
                data: { error: error.message }
            });
        }
    }
};
