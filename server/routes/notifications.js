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

router.use(auth);
router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/mark-all-read', markAllAsRead);
router.put('/:notificationId/read', markAsRead);
router.delete('/:notificationId', deleteNotification);

module.exports = router;
