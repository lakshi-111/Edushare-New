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
          status: order.status || 'pending',
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

  const allVerifiedAndApproved = transactions
    .filter((item) => ['verified', 'approved', 'paid', 'completed'].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const withdrawnAmount = req.user.withdrawnAmount || 0;
  const verifiedPayments = Math.max(0, allVerifiedAndApproved - withdrawnAmount);
  const totalEarnings = withdrawnAmount;

  const completedPayouts = transactions.filter((item) => item.status === 'paid').length;

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

  const resourceIds = [...new Set(orders.flatMap((order) => order.items.map((item) => String(item.resourceId))))];
  const resources = await Resource.find({ _id: { $in: resourceIds } }).populate('uploaderId', 'name email');
  const resourceMap = new Map(resources.map((r) => [String(r._id), r]));

  const transactions = orders.flatMap((order) =>
    order.items.map((item) => {
      const resource = resourceMap.get(String(item.resourceId));
      return {
        _id: order._id,
        itemId: item.resourceId,
        resourceId: item.resourceId,
        title: item.title,
        amount: item.price,
        status: order.status,
        buyerName: order.userId?.name || order.userId?.email || 'Unknown',
        sellerName: resource?.uploaderId?.name || 'Unknown',
        date: order.createdAt
      };
    })
  );

  res.json({ orders, transactions });
}

async function updateOrderStatus(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  const { status } = req.body;
  const orderId = req.params.id;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const allowedStatuses = ['pending', 'verified', 'approved', 'paid', 'completed', 'rejected'];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

  order.status = status;
  await order.save();

  const isVerifiedOrd = status === 'verified';
  const isApprovedOrd = status === 'approved' || status === 'paid';

  if (isVerifiedOrd || isApprovedOrd) {
    const titleText = isVerifiedOrd ? 'Payment Verified' : 'Payment Approved';
    const actionText = isVerifiedOrd ? 'verified' : 'approved';
    await createNotification({
      userId: order.userId,
      type: 'payment',
      title: titleText,
      message: `Your payment has been ${actionText} by the admin.`,
      relatedId: order._id
    });
  }

  res.json({ message: 'Order status updated.', order });
}

async function withdrawEarnings(req, res) {
  const resources = await Resource.find({ uploaderId: req.user._id });
  const resourceIds = resources.map(r => r._id);

  const orders = await Order.find({ 
    'items.resourceId': { $in: resourceIds },
    status: { $in: ['verified', 'approved', 'paid', 'completed'] }
  });

  const transactions = orders.flatMap((order) =>
    order.items
      .filter((item) => resourceIds.some(rid => rid.equals(item.resourceId)))
      .map((item) => ({ amount: item.price }))
  );

  const allVerifiedAndApproved = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const withdrawnAmount = req.user.withdrawnAmount || 0;
  const availableToWithdraw = Math.max(0, allVerifiedAndApproved - withdrawnAmount);

  if (availableToWithdraw <= 0) {
    return res.status(400).json({ message: 'No available balance to withdraw.' });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $inc: { withdrawnAmount: availableToWithdraw }
  });

  res.json({ message: `Successfully withdrawn`, amount: availableToWithdraw });
}

module.exports = { createOrder, addFreeResourceToLibrary, getUserOrders, getUserLibrary, getSellerOverview, getAllOrders, updateOrderStatus, withdrawEarnings };
