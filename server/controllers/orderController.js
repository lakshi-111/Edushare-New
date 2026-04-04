const Order = require('../models/Order');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');

async function addFreeResourceToLibrary(req, res) {
  const { resourceId } = req.body;
  if (!resourceId) return res.status(400).json({ message: 'Resource ID is required.' });

  const resource = await Resource.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found.' });
  if (resource.price > 0) return res.status(400).json({ message: 'This is not a free resource.' });

  // Check if already in library
  const existing = await Order.findOne({
    userId: req.user._id,
    'items.resourceId': resourceId
  });
  if (existing) return res.status(400).json({ message: 'This resource is already in your library.' });

  const order = await Order.create({
    userId: req.user._id,
    items: [
      {
        resourceId: resource._id,
        title: resource.title,
        price: 0,
        fileUrl: resource.fileUrl,
        fileName: resource.fileName
      }
    ],
    totalPrice: 0,
    status: 'completed'
  });

  resource.downloads += 1;
  await resource.save();
  await User.findByIdAndUpdate(resource.uploaderId, { $inc: { totalDownloads: 1 } });

  await createNotification({
    userId: req.user._id,
    type: 'payment',
    title: 'Free resource added',
    message: `You have successfully added ${resource.title} to your library.`,
    relatedId: order._id
  });

  res.status(201).json({ message: 'Resource added to your library.', order });
}

async function createOrder(req, res) {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ message: 'Cart is empty.' });

  const resourceIds = items.map((item) => item.resourceId || item._id || item.id);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
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
    status: 'completed'
  });

  await createNotification({
    userId: req.user._id,
    type: 'payment',
    title: 'Payment successful',
    message: `Your payment of ${totalPrice.toFixed(2)} is completed and ${orderItems.length} resource(s) are now in your library.`,
    relatedId: order._id
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

  res.status(201).json({ message: 'Order completed.', order });
}

async function getUserOrders(req, res) {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
}

async function getUserLibrary(req, res) {
  const orders = await Order.find({ userId: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
  const library = orders.flatMap((order) => order.items.map((item) => ({ ...item.toObject(), orderId: order._id, purchasedAt: order.createdAt })));
  res.json({ library });
}

async function getSellerOverview(req, res) {
  const resources = await Resource.find({ uploaderId: req.user._id }).sort({ createdAt: -1 });
  const resourceMap = new Map(resources.map((resource) => [String(resource._id), resource]));
  const resourceIds = resources.map((resource) => resource._id);

  if (!resourceIds.length) {
    return res.json({
      stats: {
        totalEarnings: 0,
        pendingPayments: 0,
        verifiedPayments: 0,
        completedPayouts: 0,
        totalTransactions: 0
      },
      monthlyTrend: [],
      statusBreakdown: [],
      transactions: []
    });
  }

  const orders = await Order.find({ 'items.resourceId': { $in: resourceIds } })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  const transactions = orders.flatMap((order) =>
    order.items
      .filter((item) => resourceMap.has(String(item.resourceId)))
      .map((item) => {
        const resource = resourceMap.get(String(item.resourceId));
        return {
          orderId: order._id,
          resourceId: item.resourceId,
          title: item.title,
          amount: item.price,
          status: resource?.verificationStatus || 'pending',
          buyer: order.userId?.email || order.userId?.name || 'Unknown buyer',
          buyerName: order.userId?.name || 'Unknown buyer',
          date: order.createdAt,
          moduleCode: resource?.moduleCode || '',
          faculty: resource?.faculty || '',
          semester: resource?.semester || ''
        };
      })
  );

  const pendingPayments = transactions
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const verifiedPayments = transactions
    .filter((item) => ['verified', 'approved', 'paid'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const completedPayouts = transactions.filter((item) => item.status === 'paid').length;
  const totalEarnings = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const monthLabels = [];
  const monthBuckets = new Map();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - index);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString('en-US', { month: 'short' });
    monthLabels.push({ key, label });
    monthBuckets.set(key, 0);
  }

  transactions.forEach((item) => {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthBuckets.has(key)) {
      monthBuckets.set(key, monthBuckets.get(key) + Number(item.amount || 0));
    }
  });

  const monthlyTrend = monthLabels.map(({ key, label }) => ({ label, amount: monthBuckets.get(key) || 0 }));

  const statusKeys = ['paid', 'verified', 'approved', 'pending', 'rejected'];
  const statusBreakdown = statusKeys.map((status) => ({
    status,
    count: transactions.filter((item) => item.status === status).length
  }));

  res.json({
    stats: {
      totalEarnings,
      pendingPayments,
      verifiedPayments,
      completedPayouts,
      totalTransactions: transactions.length
    },
    monthlyTrend,
    statusBreakdown,
    transactions
  });
}

async function getAllOrders(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 });
  res.json({ orders });
}

module.exports = { createOrder, addFreeResourceToLibrary, getUserOrders, getUserLibrary, getSellerOverview, getAllOrders };
