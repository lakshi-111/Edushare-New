const Notification = require('../models/Notification');

/**
 * Creates and stores a new notification record in the database.
 * 
 * @param {Object} params - The notification parameters.
 * @param {string} params.userId - The ID of the user receiving the notification.
 * @param {string} params.type - The category/type of the notification (e.g., 'payment', 'order').
 * @param {string} params.title - The concise title of the notification.
 * @param {string} params.message - The detailed message describing the event.
 * @param {string|null} [params.relatedId=null] - An optional ID of an associated entity (e.g., order ID, resource ID).
 * @returns {Promise<Object|null>} The created notification object, or null if no userId is provided.
 */
async function createNotification({ userId, type, title, message, relatedId = null }) {
  if (!userId) return null;
  return Notification.create({ userId, type, title, message, relatedId });
}

module.exports = { createNotification };
