const Notification = require('../models/Notification');

async function createNotification({ userId, type, title, message, relatedId = null }) {
  if (!userId) return null;
  return Notification.create({ userId, type, title, message, relatedId });
}

module.exports = { createNotification };
