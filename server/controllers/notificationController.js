const Notification = require('../models/Notification');

/**
 * Retrieves a list of notifications for the currently authenticated user.
 * It fetches the most recent 50 notifications, ordered by creation date in descending order.
 */
async function getUserNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
}

/**
 * Gets the total count of unread notifications for the currently authenticated user.
 */
async function getUnreadCount(req, res) {
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json({ count });
}

/**
 * Marks a specific notification as read based on the provided notification ID.
 * It also records the timestamp of when the notification was read.
 */
async function markAsRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, userId: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ message: 'Notification marked as read.', notification });
}

/**
 * Marks all unread notifications for the currently authenticated user as read.
 * It updates the 'isRead' status and sets the 'readAt' timestamp for all matching records.
 */
async function markAllAsRead(req, res) {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ message: 'All notifications marked as read.' });
}

/**
 * Deletes a specific notification from the database for the currently authenticated user
 * based on the provided notification ID.
 */
async function deleteNotification(req, res) {
  const notification = await Notification.findOneAndDelete({ _id: req.params.notificationId, userId: req.user._id });
  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  res.json({ message: 'Notification deleted.' });
}

module.exports = { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
