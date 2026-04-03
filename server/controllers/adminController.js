const User = require('../models/User');
const Resource = require('../models/Resource');
const Comment = require('../models/Comment');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');

async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  await resource.deleteOne();
  res.json({ message: 'Resource deleted.' });
}

async function getDashboard(req, res) {
  const [users, resources, comments, inquiries, orders] = await Promise.all([
    User.find(),
    Resource.find().populate('uploaderId', 'name email badge').sort({ updatedAt: -1, createdAt: -1 }),
    Comment.find({ isDeleted: false }).populate('userId', 'name').populate('resourceId', 'title'),
    Inquiry.find().sort({ createdAt: -1 }).limit(10),
    Order.find()
  ]);

  const revenue = orders.reduce((sum, item) => sum + item.totalPrice, 0);

  res.json({
    stats: {
      totalUsers: users.length,
      totalResources: resources.length,
      totalComments: comments.length,
      totalOrders: orders.length,
      totalRevenue: revenue,
      totalDownloads: resources.reduce((sum, item) => sum + item.downloads, 0),
      pendingReview: resources.filter((item) => item.verificationStatus === 'pending').length,
      verified: resources.filter((item) => item.verificationStatus === 'verified').length,
      rejected: resources.filter((item) => item.verificationStatus === 'rejected').length
    },
    users,
    resources,
    comments,
    inquiries
  });
}

async function approveResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const requestedStatus = req.body.verificationStatus || (req.body.isApproved === false ? 'rejected' : 'approved');
  const allowedStatuses = ['pending', 'verified', 'approved', 'paid', 'rejected'];
  const verificationStatus = allowedStatuses.includes(requestedStatus) ? requestedStatus : resource.verificationStatus;

  resource.verificationStatus = verificationStatus;
  if (typeof req.body.verificationNotes === 'string') {
    resource.verificationNotes = req.body.verificationNotes.trim();
  }
  resource.isApproved = verificationStatus !== 'rejected';
  await resource.save();

  const populated = await Resource.findById(resource._id).populate('uploaderId', 'name email badge');
  res.json({ message: 'Resource verification updated.', resource: populated });
}

async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });
  comment.isDeleted = true;
  await comment.save();
  res.json({ message: 'Comment deleted.' });
}

async function updateUserBadge(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.badge = req.body.badge || user.badge;
  await user.save();
  res.json({ message: 'User badge updated.', user });
}

async function updateUserRole(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  const role = req.body.role;
  if (!['student', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
  user.role = role;
  await user.save();
  res.json({ message: 'User role updated.', user });
}

async function toggleUserBlock(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.isBlocked = !!req.body.isBlocked;
  await user.save();
  res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.`, user });
}

async function removeUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  await user.deleteOne();
  res.json({ message: 'User removed.' });
}

module.exports = {
  getDashboard,
  approveResource,
  deleteResource,
  deleteComment,
  updateUserBadge,
  updateUserRole,
  toggleUserBlock,
  removeUser
};
