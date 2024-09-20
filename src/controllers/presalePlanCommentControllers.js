const PresalePlanComment = require('../models/presalePlanComment');
const { validationResult } = require('express-validator');
const { sanitizeString } = require('../utils/stringUtils');

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

        const { presalePlan, comment } = req.body;

        try {
            const newComment = new PresalePlanComment({
                presalePlan,
                comment: sanitizeString(comment),
                createdBy: req.user._id
            });

            await newComment.save();

            return res.status(201).json({
                EC: 0,
                message: 'Comment added successfully',
                data: newComment
            });
        } catch (error) {
            return res.status(500).json({
                EC: 1,
                message: 'Error adding comment',
                data: { error: error.message }
            });
        }
    }
};
