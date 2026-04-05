const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Comment = require('../models/Comment');
const Inquiry = require('../models/Inquiry');
const Order = require('../models/Order');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const Connection = require('../models/Connection');
const AdminLog = require('../models/AdminLog');
const Report = require('../models/Report');
const Snapshot = require('../models/Snapshot');
const { createNotification } = require('../utils/notifications');
const { sendWelcomeEmail, sendWarningEmail, sendRejectionEmail, sendApprovalEmail } = require('../utils/email');

async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  await resource.deleteOne();
  res.json({ message: 'Resource deleted.' });
}

async function getDashboard(req, res) {
  const [users, resources, comments, inquiries, orders, adminLogs] = await Promise.all([
    User.find(),
    Resource.find().populate('uploaderId', 'name email badge ratingBadge').sort({ updatedAt: -1, createdAt: -1 }),
    Comment.find({ isDeleted: false }).populate('userId', 'name').populate('resourceId', 'title'),
    Inquiry.find().sort({ createdAt: -1 }).limit(10),
    Order.find(),
    AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(10)
  ]);

  const badgeCounts = await User.aggregate([
    { $group: { _id: { $ifNull: ['$ratingBadge', 'Unranked'] }, count: { $sum: 1 } } }
  ]);
  const ratingLeaderboard = await User.find()
    .sort({ averageRating: -1 })
    .limit(10)
    .select('name email ratingBadge averageRating uploadCount');

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
    ratingStats: {
      counts: badgeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      leaderboard: ratingLeaderboard
    },
    users,
    resources,
    comments,
    inquiries,
    adminLogs
  });
}

async function getUsers(req, res) {
  const filter = {};
  const search = String(req.query.q || req.query.search || '').trim();
  const role = String(req.query.role || 'all');
  const faculty = String(req.query.faculty || 'all');
  const year = String(req.query.year || 'all');
  const ratingBadge = String(req.query.ratingBadge || 'all');

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentIdNumber: { $regex: search, $options: 'i' } }
    ];
  }
  if (role !== 'all') filter.role = role;
  if (faculty !== 'all') filter.faculty = faculty;
  if (year !== 'all') filter.year = year;
  if (ratingBadge !== 'all') filter.ratingBadge = ratingBadge;

  const users = await User.find(filter).sort({ createdAt: -1 });
  const stats = {
    totalUsers: users.length,
    totalAdmins: users.filter((u) => u.role === 'admin').length,
    blockedUsers: users.filter((u) => u.isBlocked).length,
    activeUsers: users.filter((u) => !u.isBlocked).length
  };

  res.json({ users, stats });
}

async function createUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: 'Validation failed.', errors: errors.array() });

  const { name, email, password, studentIdNumber = '', faculty = '', year = '', role = 'student' } = req.body;
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) return res.status(400).json({ message: 'A user already exists with this email.' });

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    studentIdNumber: String(studentIdNumber || '').trim(),
    faculty: String(faculty || '').trim(),
    year: String(year || '').trim(),
    role: ['admin', 'student'].includes(role) ? role : 'student'
  });

  try {
    await sendWelcomeEmail({ to: user.email, name: user.name, email: user.email, password });
  } catch (emailError) {
    console.warn('Welcome email failed:', emailError.message || emailError);
  }

  await AdminLog.create({
    adminId: req.user._id,
    targetUserId: user._id,
    action: 'create_user',
    description: `${req.user.name} created a new ${user.role} account for ${user.email}`
  });

  const safeUser = user.toObject();
  delete safeUser.password;

  res.status(201).json({ message: 'User created successfully.', user: safeUser });
}

async function performCascadeDelete(targetId, session = null) {
  const options = session ? { session } : {};
  const query = Resource.find({ uploaderId: targetId }).select('_id');
  if (session) query.session(session);
  const resources = await query;
  const resourceIds = resources.map((resource) => resource._id);

  // Delete all ratings given by this user
  await Rating.deleteMany({ userId: targetId }, options);
  
  // Delete all ratings and comments for this user's resources
  if (resourceIds.length) {
    await Rating.deleteMany({ resourceId: { $in: resourceIds } }, options);
    await Comment.deleteMany({ resourceId: { $in: resourceIds } }, options);
    // Mark user's resources as having a deleted uploader (don't delete them)
    await Resource.updateMany({ uploaderId: targetId }, { uploaderDeleted: true }, options);
  }

  // Delete all comments from this user
  await Comment.deleteMany({ userId: targetId }, options);
  
  // Delete all inquiries from this user
  await Inquiry.deleteMany({ userId: targetId }, options);
  
  // Delete all orders for this user (both as buyer and seller of resources)
  await Order.deleteMany({ userId: targetId }, options);
  
  // Delete all notifications for this user
  await Notification.deleteMany({ userId: targetId }, options);
  
  // Disconnect all connections for this user
  await Connection.deleteMany({ $or: [{ requesterId: targetId }, { recipientId: targetId }] }, options);
  
  // Delete the user
  await User.deleteOne({ _id: targetId }, options);
}

async function deleteUser(req, res) {
  const targetId = req.params.id;
  if (targetId === req.user._id.toString()) {
    return res.status(403).json({ message: 'You cannot delete your own account.' });
  }

  const user = await User.findById(targetId);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const session = await mongoose.startSession();
  let usedTransaction = false;
  try {
    await session.withTransaction(async () => {
      usedTransaction = true;
      await performCascadeDelete(targetId, session);
      await AdminLog.create([
        {
          adminId: req.user._id,
          targetUserId: targetId,
          action: 'delete_user',
          description: `${req.user.name} deleted the account for ${user.email}`
        }
      ], { session });
    });
  } catch (error) {
    if (usedTransaction) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    await performCascadeDelete(targetId);
    await AdminLog.create({
      adminId: req.user._id,
      targetUserId: targetId,
      action: 'delete_user',
      description: `${req.user.name} deleted the account for ${user.email}`
    });
  } finally {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
  }

  res.json({ message: 'User and all connected data have been removed.' });
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

  const populated = await Resource.findById(resource._id).populate('uploaderId', 'name email badge ratingBadge');
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

async function getModerationStats(req, res) {
  // Get unique comments with pending reports
  const pendingReportsAgg = await Report.aggregate([
    { $match: { status: 'pending' } },
    { $group: { _id: '$commentId' } },
    { $count: 'count' }
  ]);
  const reportedComments = pendingReportsAgg[0]?.count || 0;

  const pendingInquiries = await Inquiry.countDocuments({ status: 'Pending' });

  res.json({
    reportedComments,
    pendingInquiries,
    totalAlerts: reportedComments + pendingInquiries
  });
}

async function getModerationItems(req, res) {
  const [reports, inquiries] = await Promise.all([
    Report.find({ status: 'pending' })
      .populate('commentId', 'content userId resourceId')
      .populate('resourceId', 'title')
      .populate('reporterId', 'name')
      .populate({
        path: 'commentId',
        populate: { path: 'userId', select: 'name' }
      })
      .sort({ createdAt: -1 }),
    Inquiry.find({ status: 'Pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
  ]);

  // Group reports by commentId to count reports per comment
  const reportGroups = {};
  reports.forEach(r => {
    const cid = r.commentId?._id?.toString();
    if (!reportGroups[cid]) {
      reportGroups[cid] = {
        commentId: r.commentId,
        resourceId: r.resourceId,
        resourceTitle: r.resourceId?.title || 'Unknown Resource',
        commentText: r.commentId?.content || 'Comment deleted',
        commentAuthor: r.commentId?.userId?.name || 'Unknown',
        reports: []
      };
    }
    reportGroups[cid].reports.push({
      id: r._id,
      reporter: r.reporterId?.name || 'Unknown',
      reason: r.reason,
      description: r.description,
      createdAt: r.createdAt
    });
  });

  const reportItems = Object.values(reportGroups).map(group => ({
    type: 'report',
    commentId: group.commentId?._id,
    resourceId: group.resourceId?._id,
    resourceTitle: group.resourceTitle,
    commentText: group.commentText,
    commentAuthor: group.commentAuthor,
    commentAuthorId: group.commentId?.userId,
    reportCount: group.reports.length,
    reports: group.reports,
    latestReportAt: Math.max(...group.reports.map(r => new Date(r.createdAt)))
  }));

  // Sort reported items first by report count, then by latest report date.
  reportItems.sort((a, b) => {
    if (b.reportCount !== a.reportCount) return b.reportCount - a.reportCount;
    return new Date(b.latestReportAt) - new Date(a.latestReportAt);
  });

  const topReportedComment = reportItems[0] || null;

  const inquiryItems = inquiries.map(i => ({
    type: 'inquiry',
    id: i._id,
    user: i.userId?.name || 'Unknown',
    email: i.userId?.email || 'Unknown',
    subject: i.subject,
    message: i.message,
    createdAt: i.createdAt
  }));

  const items = [
    ...reportItems.map(item => ({ ...item, sortKey: item.latestReportAt })),
    ...inquiryItems.map(item => ({ ...item, sortKey: item.createdAt }))
  ].sort((a, b) => new Date(b.sortKey) - new Date(a.sortKey));


  res.json({ items, topReportedComment });
}

async function dismissReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  report.status = 'dismissed';
  report.adminNote = req.body.adminNote || '';
  await report.save();
  res.json({ message: 'Report dismissed.' });
}

async function resolveReport(req, res) {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found.' });
  report.status = 'resolved';
  report.adminNote = req.body.adminNote || '';
  await report.save();
  res.json({ message: 'Report resolved.' });
}

async function editComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });
  comment.content = req.body.content;
  await comment.save();
  res.json({ message: 'Comment edited.' });
}

async function deleteReportedComment(req, res) {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });

  // Delete comment and all replies
  await Comment.updateMany(
    { $or: [{ _id: req.params.id }, { parentCommentId: req.params.id }] },
    { isDeleted: true }
  );

  // Resolve all reports on this comment
  await Report.updateMany({ commentId: req.params.id }, { status: 'resolved' });

  // Increment violation count for the user
  const user = await User.findById(comment.userId);
  if (user) {
    user.violationCount += 1;
    if (user.violationCount >= 3) { // Ban after 3 violations
      user.banned = true;
    }
    await user.save();
  }

  res.json({ message: 'Comment deleted and reports resolved.' });
}

async function warnUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  try {
    await sendWarningEmail({ to: user.email, name: user.name });
  } catch (emailError) {
    console.warn('Warning email failed:', emailError.message || emailError);
    return res.status(500).json({ message: 'Failed to send warning email.' });
  }

  res.json({ message: 'Warning email sent.' });
}

async function banUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  user.banned = true;
  await user.save();
  res.json({ message: 'User banned.' });
}

async function resolveInquiry(req, res) {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) return res.status(404).json({ message: 'Inquiry not found.' });
  inquiry.status = 'Closed';
  await inquiry.save();
  res.json({ message: 'Inquiry resolved.' });
}

async function getStats(req, res) {
  const [users, resources, orders] = await Promise.all([
    User.find(),
    Resource.find(),
    Order.find()
  ]);

  const totalUsers = users.length;
  const activeStudents = users.filter(u => u.role === 'student').length;
  const totalResources = resources.length;
  const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads || 0), 0);

  // Get rating stats
  const badgeCounts = await User.aggregate([
    { $group: { _id: { $ifNull: ['$ratingBadge', 'Unranked'] }, count: { $sum: 1 } } }
  ]);
  const ratingLeaderboard = await User.find()
    .sort({ averageRating: -1 })
    .limit(10)
    .select('name email ratingBadge averageRating uploadCount');

  // Get last year's snapshot for percentage changes
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const lastYearSnapshot = await Snapshot.findOne({
    date: { $gte: lastYear, $lt: new Date() }
  }).sort({ date: -1 });

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  res.json({
    totalUsers,
    activeStudents,
    totalResources,
    totalDownloads,
    changes: {
      totalUsers: calculateChange(totalUsers, lastYearSnapshot?.totalUsers),
      activeStudents: calculateChange(activeStudents, lastYearSnapshot?.activeStudents),
      totalResources: calculateChange(totalResources, lastYearSnapshot?.totalResources),
      totalDownloads: calculateChange(totalDownloads, lastYearSnapshot?.totalDownloads)
    },
    ratingStats: {
      counts: badgeCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      leaderboard: ratingLeaderboard
    }
  });
}

async function getRevenue(req, res) {
  const period = req.query.period || 'week';
  const now = new Date();

  let startDate, groupBy, dataPoints;

  if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    dataPoints = 7;
  } else if (period === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    groupBy = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
    dataPoints = 4; // 4 weeks
  } else if (period === 'year') {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    dataPoints = 12;
  }

  const revenueData = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Calculate fixed period totals
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [monthlyRevenue, weeklyRevenue, todayRevenue] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  res.json({
    period,
    data: revenueData.map(item => ({
      period: item._id,
      revenue: item.revenue
    })),
    summary: {
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      weeklyRevenue: weeklyRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0
    }
  });
}

async function getActivity(req, res) {
  const limit = parseInt(req.query.limit) || 10;

  const [resources, inquiries, orders, adminLogs] = await Promise.all([
    Resource.find().populate('uploaderId', 'name').sort({ createdAt: -1 }).limit(limit),
    Inquiry.find().sort({ createdAt: -1 }).limit(limit),
    Order.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(limit),
    AdminLog.find().populate('adminId', 'name').sort({ createdAt: -1 }).limit(limit)
  ]);

  const activities = [
    ...resources.map(r => ({
      id: `resource-${r._id}`,
      type: 'resource_uploaded',
      title: `Resource uploaded: ${r.title}`,
      description: `Uploaded by ${r.uploaderId?.name || 'Unknown'}`,
      amount: r.price ? `$${r.price.toFixed(2)}` : 'Free',
      timestamp: r.createdAt,
      data: { resourceId: r._id }
    })),
    ...inquiries.map(i => ({
      id: `inquiry-${i._id}`,
      type: 'inquiry_pending',
      title: `Inquiry: ${i.subject}`,
      description: `From ${i.name} (${i.email})`,
      amount: i.status === 'Answered' ? 'Answered' : 'Pending',
      timestamp: i.createdAt,
      data: { inquiryId: i._id }
    })),
    ...orders.map(o => ({
      id: `order-${o._id}`,
      type: 'order_placed',
      title: `Order placed`,
      description: `By ${o.userId?.name || 'Unknown user'}`,
      amount: `$${o.totalPrice.toFixed(2)}`,
      timestamp: o.createdAt,
      data: { orderId: o._id }
    })),
    ...adminLogs
      .filter(l => !['delete_resource', 'bulk_delete_resource'].includes(l.action))
      .map(l => ({
        id: `admin-${l._id}`,
        type: 'admin_action',
        title: l.description,
        description: `Action by ${l.adminId?.name || 'Admin'}`,
        amount: l.action,
        timestamp: l.createdAt,
        data: { logId: l._id }
      }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);

  res.json({ activities });
}

async function getResources(req, res) {
  const { status, search, sort = 'createdAt', order = 'desc' } = req.query;

  let filter = {};
  if (status && status !== 'all') {
    filter.verificationStatus = status;
  }
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { faculty: { $regex: search, $options: 'i' } }
    ];
  }

  const sortOrder = order === 'desc' ? -1 : 1;
  const resources = await Resource.find(filter)
    .populate('uploaderId', 'name email')
    .sort({ [sort]: sortOrder });

  res.json({ resources });
}

async function approveResource(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploaderId');
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  const oldStatus = resource.verificationStatus;
  resource.verificationStatus = 'verified';
  resource.isApproved = true;
  await resource.save();

  // Recalculate uploader's badge
  await resource.uploaderId.updateBadge();
  await resource.uploaderId.save();

  // Send approval email
  try {
    await sendApprovalEmail({
      to: resource.uploaderId.email,
      name: resource.uploaderId.name,
      resourceTitle: resource.title
    });
  } catch (emailError) {
    console.warn('Approval email failed:', emailError.message || emailError);
  }

  await AdminLog.create({
    adminId: req.user._id,
    targetResourceId: resource._id,
    action: 'approve_resource',
    description: `${req.user.name} approved resource "${resource.title}"`
  });

  res.json({ message: 'Resource approved.', resource });
}

async function rejectResource(req, res) {
  const { reason } = req.body;
  const resource = await Resource.findById(req.params.id).populate('uploaderId');
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  resource.verificationStatus = 'rejected';
  resource.verificationNotes = reason;
  resource.isApproved = false;
  await resource.save();

  // Send rejection email
  try {
    await sendRejectionEmail({
      to: resource.uploaderId.email,
      name: resource.uploaderId.name,
      resourceTitle: resource.title,
      reason
    });
  } catch (emailError) {
    console.warn('Rejection email failed:', emailError.message);
  }

  await AdminLog.create({
    adminId: req.user._id,
    targetResourceId: resource._id,
    action: 'reject_resource',
    description: `${req.user.name} rejected resource "${resource.title}"`
  });

  res.json({ message: 'Resource rejected.', resource });
}

async function deleteResource(req, res) {
  const resource = await Resource.findById(req.params.id).populate('uploaderId');
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });

  // Delete associated data
  await Promise.all([
    Rating.deleteMany({ resourceId: req.params.id }),
    Comment.deleteMany({ resourceId: req.params.id }),
    Order.updateMany(
      { 'items.resourceId': req.params.id },
      { $pull: { items: { resourceId: req.params.id } } }
    ),
    // Remove from user libraries/carts
    User.updateMany(
      { $or: [{ 'library': req.params.id }, { 'cart': req.params.id }] },
      { $pull: { library: req.params.id, cart: req.params.id } }
    )
  ]);

  // Delete physical file if it exists
  if (resource.fileUrl) {
    try {
      const filePath = path.join(__dirname, '..', resource.fileUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn('File deletion failed:', fileError.message || fileError);
    }
  }

  // Delete the resource
  await resource.deleteOne();

  // Recalculate uploader's badge
  await resource.uploaderId.updateBadge();
  await resource.uploaderId.save();

  await AdminLog.create({
    adminId: req.user._id,
    targetResourceId: req.params.id,
    action: 'delete_resource',
    description: `${req.user.name} deleted resource "${resource.title}"`
  });

  res.json({ message: 'Resource deleted.' });
}

async function bulkApproveResources(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'IDs must be an array.' });

  const resources = await Resource.find({ _id: { $in: ids } }).populate('uploaderId');
  const updatedResources = [];

  for (const resource of resources) {
    resource.verificationStatus = 'verified';
    resource.isApproved = true;
    await resource.save();
    await resource.uploaderId.updateBadge();
    await resource.uploaderId.save();
    updatedResources.push(resource);

    // Send approval email
    try {
      await sendApprovalEmail({
        to: resource.uploaderId.email,
        name: resource.uploaderId.name,
        resourceTitle: resource.title
      });
    } catch (emailError) {
      console.warn('Approval email failed:', emailError.message || emailError);
    }

    await AdminLog.create({
      adminId: req.user._id,
      targetResourceId: resource._id,
      action: 'bulk_approve_resource',
      description: `${req.user.name} bulk approved resource "${resource.title}"`
    });
  }

  res.json({ message: `${updatedResources.length} resources approved.`, resources: updatedResources });
}

async function bulkRejectResources(req, res) {
  const { ids, reason } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'IDs must be an array.' });

  const resources = await Resource.find({ _id: { $in: ids } }).populate('uploaderId');
  const updatedResources = [];

  for (const resource of resources) {
    resource.verificationStatus = 'rejected';
    resource.verificationNotes = reason;
    resource.isApproved = false;
    await resource.save();
    updatedResources.push(resource);

    try {
      await sendRejectionEmail({
        to: resource.uploaderId.email,
        name: resource.uploaderId.name,
        resourceTitle: resource.title,
        reason
      });
    } catch (emailError) {
      console.warn('Rejection email failed:', emailError.message);
    }

    await AdminLog.create({
      adminId: req.user._id,
      targetResourceId: resource._id,
      action: 'bulk_reject_resource',
      description: `${req.user.name} bulk rejected resource "${resource.title}"`
    });
  }

  res.json({ message: `${updatedResources.length} resources rejected.`, resources: updatedResources });
}

async function bulkDeleteResources(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ message: 'IDs must be an array.' });

  const resources = await Resource.find({ _id: { $in: ids } }).populate('uploaderId');

  for (const resource of resources) {
    await Promise.all([
      Rating.deleteMany({ resourceId: resource._id }),
      Comment.deleteMany({ resourceId: resource._id }),
      Order.updateMany(
        { 'items.resourceId': resource._id },
        { $pull: { items: { resourceId: resource._id } } }
      ),
      User.updateMany(
        { $or: [{ 'library': resource._id }, { 'cart': resource._id }] },
        { $pull: { library: resource._id, cart: resource._id } }
      )
    ]);

    // Delete physical file if it exists
    if (resource.fileUrl) {
      try {
        const filePath = path.join(__dirname, '..', resource.fileUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.warn('File deletion failed:', fileError.message || fileError);
      }
    }

    await resource.uploaderId.updateBadge();
    await resource.uploaderId.save();

    await AdminLog.create({
      adminId: req.user._id,
      targetResourceId: resource._id,
      action: 'bulk_delete_resource',
      description: `${req.user.name} bulk deleted resource "${resource.title}"`
    });
  }

  await Resource.deleteMany({ _id: { $in: ids } });

  res.json({ message: `${ids.length} resources deleted.` });
}

module.exports = {
  getDashboard,
  getUsers,
  createUser,
  deleteUser,
  getStats,
  getRevenue,
  getActivity,
  getResources,
  approveResource,
  rejectResource,
  deleteResource,
  bulkApproveResources,
  bulkRejectResources,
  bulkDeleteResources,
  getModerationStats,
  getModerationItems,
  dismissReport,
  resolveReport,
  editComment,
  deleteReportedComment,
  deleteComment,
  warnUser,
  banUser,
  resolveInquiry,
  updateUserBadge,
  updateUserRole,
  toggleUserBlock
};
