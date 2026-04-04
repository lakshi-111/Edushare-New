const Inquiry = require('../models/Inquiry');
const Resource = require('../models/Resource');
const { createNotification } = require('../utils/notifications');

async function createInquiry(req, res) {
  const { resourceId, subject, message } = req.body;
  const resource = await Resource.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const inquiry = await Inquiry.create({
    resourceId,
    userId: req.user._id,
    name: req.user.name,
    email: req.user.email,
    subject,
    message
  });

  if (resource.uploaderId.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: resource.uploaderId,
      type: 'inquiry',
      title: 'New inquiry',
      message: `${req.user.name} sent an inquiry about "${resource.title}".`,
      relatedId: inquiry._id
    });
  }

  res.status(201).json({ message: 'Inquiry sent.', inquiry });
}

async function getResourceInquiries(req, res) {
  const resource = await Resource.findById(req.params.resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const allowed = req.user && (resource.uploaderId.toString() === req.user._id.toString() || req.user.role === 'admin');
  if (!allowed) return res.status(403).json({ message: 'Only the uploader or admin can view these inquiries.' });

  const inquiries = await Inquiry.find({ resourceId: req.params.resourceId }).sort({ createdAt: -1 });
  res.json({ inquiries });
}

async function getMyInquiries(req, res) {
  const inquiries = await Inquiry.find({ userId: req.user._id })
    .populate('resourceId', 'title')
    .sort({ createdAt: -1 });
  res.json({ inquiries });
}

async function getReceivedInquiries(req, res) {
  // Get all resources uploaded by the current user
  const userResources = await Resource.find({ uploaderId: req.user._id }, '_id');

  // Get all inquiries for those resources
  const resourceIds = userResources.map(resource => resource._id);
  const inquiries = await Inquiry.find({ resourceId: { $in: resourceIds } })
    .populate('resourceId', 'title')
    .sort({ createdAt: -1 });

  res.json({ inquiries });
}

async function answerInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.inquiryId).populate('resourceId');
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

  const uploaderId = inquiry.resourceId.uploaderId.toString();
  if (req.user.role !== 'admin' && uploaderId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You cannot answer this inquiry.' });
  }

  inquiry.answer = req.body.answer || '';
  inquiry.status = 'Answered';
  inquiry.answeredAt = new Date();
  await inquiry.save();

  await createNotification({
    userId: inquiry.userId,
    type: 'inquiry',
    title: 'Inquiry answered',
    message: `Your inquiry about "${inquiry.resourceId.title}" has been answered.`,
    relatedId: inquiry._id
  });

  res.json({ message: 'Inquiry answered.', inquiry });
}

async function resolveInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.inquiryId);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });

  inquiry.status = 'Closed';
  await inquiry.save();

  res.json({ message: 'Inquiry resolved.', inquiry });
}

module.exports = { createInquiry, getResourceInquiries, getMyInquiries, getReceivedInquiries, answerInquiry, resolveInquiry };
