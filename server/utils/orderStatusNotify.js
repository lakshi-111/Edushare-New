const Resource = require('../models/Resource');
const { createNotification } = require('./notifications');

/**
 * Seller-only admin notifications (verified / approved / paid). Buyer "library unlocked" messaging
 * lives in orderController.applySellerCreditsIfNeeded, which runs before this so balances match copy.
 */
async function notifyOrderPaymentStatus(order, status) {
  const isVerifiedOrd = status === 'verified';
  const isApprovedOrd = status === 'approved' || status === 'paid';
  if (!isVerifiedOrd && !isApprovedOrd) return;

  const titleText = isVerifiedOrd ? 'Payment Verified' : 'Payment Approved';
  const actionText = isVerifiedOrd ? 'verified' : 'approved';

  const resourceIds = order.items.map((item) => item.resourceId);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  await Promise.all(
    resources.map((resource) => {
      if (resource.uploaderId.toString() !== order.userId.toString()) {
        return createNotification({
          userId: resource.uploaderId,
          type: 'verification',
          title: `Selling ${titleText}`,
          message: `The payment for your resource "${resource.title}" has been ${actionText} by the admin. The earnings are now verified and available in your balance.`,
          relatedId: order._id
        });
      }
      return Promise.resolve();
    })
  );
}

module.exports = { notifyOrderPaymentStatus };
