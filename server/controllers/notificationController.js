const Notification = require('../models/Notification');

async function getUserNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
}

async function getUnreadCount(req, res) {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json({ count });
}

async function markAsRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ message: 'Notification marked as read.', notification });
}

async function markAllAsRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ message: 'All notifications marked as read.' });
}

async function deleteNotification(req, res) {
  const notification = await Notification.findOneAndDelete({ _id: req.params.notificationId, userId: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ message: 'Notification deleted.' });
}

module.exports = { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
