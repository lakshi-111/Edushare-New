const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

// Apply authentication middleware to all notification routes
router.use(auth);

// Route to fetch the active user's notifications history
router.get('/', getUserNotifications);

// Route to get the total number of unread notifications
router.get('/unread-count', getUnreadCount);

// Route to aggressively mark all user's notifications as read
router.put('/mark-all-read', markAllAsRead);

// Route to mark a specific notification as read by its unique ID
router.put('/:notificationId/read', markAsRead);

// Route to permanently delete a specific notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
