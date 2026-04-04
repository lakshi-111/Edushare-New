const Comment = require('../models/Comment');
const Resource = require('../models/Resource');
const Report = require('../models/Report');
const { validationResult } = require('express-validator');
const { createNotification } = require('../utils/notifications');

async function createComment(req, res) {
  const { resourceId, content, parentCommentId = null } = req.body;
  const resource = await Resource.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const comment = await Comment.create({
    resourceId,
    userId: req.user._id,
    content,
    parentCommentId
  });

  const populated = await Comment.findById(comment._id).populate('userId', 'name email badge ratingBadge');

  if (resource.uploaderId.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: resource.uploaderId,
      type: 'comment',
      title: 'New comment',
      message: `${req.user.name} commented on "${resource.title}".`,
      relatedId: resourceId
    });
  }

  res.status(201).json({ message: 'Comment added.', comment: populated });
}

async function getResourceComments(req, res) {
  const comments = await Comment.find({
    resourceId: req.params.resourceId,
    isDeleted: false
  })
    .populate('userId', 'name email badge ratingBadge')
    .sort({ createdAt: -1 });

  res.json({ comments });
}

async function updateComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found.' });

  if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You cannot edit this comment.' });
  }

  comment.content = req.body.content || comment.content;
  await comment.save();
  const populated = await Comment.findById(comment._id).populate('userId', 'name email badge ratingBadge');
  res.json({ message: 'Comment updated.', comment: populated });
}

async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found.' });

  if (comment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You cannot delete this comment.' });
  }

  comment.isDeleted = true;
  await comment.save();
  res.json({ message: 'Comment deleted.' });
}

async function reportComment(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { reason, description } = req.body;
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) return res.status(404).json({ message: 'Comment not found.' });

  if (comment.userId.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot report your own comment.' });
  }

  const existingReport = await Report.findOne({
    commentId: req.params.id,
    reporterId: req.user._id
  });
  if (existingReport) {
    return res.status(400).json({ message: 'You have already reported this comment.' });
  }

  const report = await Report.create({
    commentId: req.params.id,
    resourceId: comment.resourceId,
    reporterId: req.user._id,
    reason,
    description
  });

  res.status(201).json({ message: 'Comment reported successfully.', report });
}

async function getCommentHistory(req, res) {
  const comments = await Comment.find({ userId: req.user._id, isDeleted: false })
    .populate('resourceId', 'title')
    .sort({ createdAt: -1 });
  res.json({ comments });
}

module.exports = {
  createComment,
  getResourceComments,
  updateComment,
  deleteComment,
  reportComment,
  getCommentHistory
};
