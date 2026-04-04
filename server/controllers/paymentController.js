const Order = require('../models/Order');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

async function processPayment(req, res) {
  const { items, paymentMethod, card } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Cart is empty.' });
  if (!paymentMethod) return res.status(400).json({ message: 'Payment method is required.' });

  const resourceIds = items.map((item) => item.resourceId || item._id || item.id);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
  }

  // Simulate payment processing
  if (!card?.number || !card?.expiry || !card?.cvv) {
    return res.status(400).json({ message: 'Invalid payment details.' });
  }

  const orderItems = resources.map((resource) => ({
    resourceId: resource._id,
    title: resource.title,
    price: resource.price,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName
  }));

  const totalPrice = orderItems.reduce((sum, item) => sum + item.price, 0);

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    totalPrice,
    status: 'pending'
  });

  await Promise.all(
    resources
      .filter((resource) => resource.uploaderId.toString() !== req.user._id.toString())
      .map(async (resource) => {
        await User.findByIdAndUpdate(resource.uploaderId, {
          $inc: { totalEarnings: resource.price > 0 ? resource.price : 0 }
        });

        return createNotification({
          userId: resource.uploaderId,
          type: 'order',
          title: 'Resource purchased',
          message: `${req.user.name} purchased "${resource.title}".`,
          relatedId: order._id
        });
      })
  );

  await createNotification({
    userId: req.user._id,
    type: 'payment',
    title: 'Payment successful',
    message: `Your payment of Rs ${totalPrice.toFixed(2)} is complete and resources are added to your library.`,
    relatedId: order._id
  });

  res.status(201).json({ message: 'Payment processed and order completed.', order, totalPrice });
}

module.exports = { processPayment };