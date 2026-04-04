const Connection = require('../models/Connection');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

async function discoverUsers(req, res) {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('name email badge ratingBadge role uploadCount totalDownloads averageRating');
  res.json({ users });
}

async function createConnection(req, res) {
  const { recipientId, type = 'FOLLOW', message = '' } = req.body;
  if (recipientId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot connect with yourself.' });
  }

  let connection = await Connection.findOne({
    requesterId: req.user._id,
    recipientId
  });

  if (connection) {
    return res.status(400).json({ message: 'Connection request already exists.' });
  }

  connection = await Connection.create({
    requesterId: req.user._id,
    recipientId,
    type,
    message
  });

  await createNotification({
    userId: recipientId,
    type: 'connection',
    title: 'New connection request',
    message: `${req.user.name} sent you a ${type.toLowerCase()} request.`,
    relatedId: connection._id
  });

  res.status(201).json({ message: 'Connection request sent.', connection });
}

async function getConnections(req, res) {
  const connections = await Connection.find({
    $or: [{ requesterId: req.user._id }, { recipientId: req.user._id }]
  })
    .populate('requesterId', 'name email badge ratingBadge')
    .populate('recipientId', 'name email badge ratingBadge')
    .sort({ createdAt: -1 });

  res.json({ connections });
}

async function updateConnectionStatus(req, res) {
  const connection = await Connection.findById(req.params.id)
    .populate('requesterId', 'name')
    .populate('recipientId', 'name');

  if (!connection) return res.status(404).json({ message: 'Connection not found.' });
  if (connection.recipientId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the recipient can update this request.' });
  }

  connection.status = req.body.status;
  await connection.save();

  await createNotification({
    userId: connection.requesterId._id,
    type: 'connection',
    title: 'Connection updated',
    message: `${connection.recipientId.name} ${req.body.status.toLowerCase()} your connection request.`,
    relatedId: connection._id
  });

  res.json({ message: 'Connection updated.', connection });
}

module.exports = { discoverUsers, createConnection, getConnections, updateConnectionStatus };
