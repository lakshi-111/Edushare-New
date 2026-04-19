const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notifications');

async function getUserNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ notifications });
}

async function createCartNotification(req, res) {
  const { resourceTitle, resourcePrice } = req.body;
  
  try {
    await createNotification({
      userId: req.user._id,
      type: 'cart_update',
      title: 'Resource Added to Cart',
      message: `${resourceTitle} has been added to your cart${resourcePrice > 0 ? ` for Rs ${resourcePrice}` : ' (Free)'}`,
      relatedId: null
    });
    
    res.json({ success: true, message: 'Cart notification created' });
  } catch (error) {
    console.error('Error creating cart notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
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

module.exports = { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, createCartNotification };
