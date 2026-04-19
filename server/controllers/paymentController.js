/**
 * Payment controller: persists Payment docs, admin ledger (payment rows + legacy orders without Payment),
 * status updates in tandem with Orders, reuses applySellerCreditsIfNeeded from orderController.
 */
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const { notifyOrderPaymentStatus } = require('../utils/orderStatusNotify');
const { applySellerCreditsIfNeeded } = require('./orderController');

const PAYMENT_STATUSES = ['pending', 'verified', 'approved', 'paid', 'completed', 'failed', 'rejected', 'refunded'];
const ORDER_SYNC_STATUSES = ['pending', 'verified', 'approved', 'paid', 'completed', 'rejected'];

function cardLastFour(cardNumber) {
  if (!cardNumber) return undefined;
  const digits = String(cardNumber).replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : undefined;
}

/**
 * Checkout via payment page: validates gateway payload, creates pending order + payment
 * until an admin updates status (same flow as /orders/checkout).
 */
async function processPayment(req, res) {
  const { items, paymentMethod, card } = req.body;

  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Cart is empty.' });
  if (!paymentMethod) return res.status(400).json({ message: 'Payment method is required.' });

  const resourceIds = items.map((item) => item.resourceId || item._id || item.id);
  const resources = await Resource.find({ _id: { $in: resourceIds } });

  if (resources.length !== resourceIds.length) {
    return res.status(400).json({ message: 'One or more resources were not found.' });
  }

  const isPayPal = String(paymentMethod).toLowerCase() === 'paypal';
  if (!isPayPal) {
    if (!card?.number || !card?.expiry || !card?.cvv) {
      return res.status(400).json({ message: 'Invalid payment details.' });
    }
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

  const payment = await Payment.create({
    userId: req.user._id,
    orderId: order._id,
    items: orderItems,
    totalAmount: totalPrice,
    currency: 'LKR',
    paymentMethod,
    cardLast4: isPayPal ? undefined : cardLastFour(card.number),
    status: 'pending'
  });

  await createNotification({
    userId: req.user._id,
    type: 'payment',
    title: 'Payment received',
    message: `Your payment of Rs ${totalPrice.toFixed(2)} is pending admin verification. You will be notified when your resources are available in your library.`,
    relatedId: order._id
  });

  res.status(201).json({
    message: 'Payment submitted and pending verification.',
    order,
    payment,
    totalPrice
  });
}

/** List current user's payments (newest first). */
async function listMyPayments(req, res) {
  const payments = await Payment.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .populate('orderId', 'status totalPrice createdAt');
  res.json({ payments });
}

/** Single payment: owner or admin. */
async function getPaymentById(req, res) {
  const payment = await Payment.findById(req.params.id).populate('orderId').populate('userId', 'name email');
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const ownerId = payment.userId?._id ? payment.userId._id.toString() : payment.userId.toString();
  const isOwner = ownerId === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Access denied.' });

  res.json({ payment });
}

/** Admin: flattened ledger — payment-backed rows plus legacy orders without a Payment document. */
async function getAdminPaymentLedger(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const payments = await Payment.find().populate('userId', 'name email').sort({ createdAt: -1 });
  const paymentOrderIds = payments.map((p) => p.orderId);

  const legacyOrders = await Order.find({ _id: { $nin: paymentOrderIds } })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  const resourceIds = [
    ...new Set(
      [...payments.flatMap((p) => p.items.map((i) => String(i.resourceId))), ...legacyOrders.flatMap((o) => o.items.map((i) => String(i.resourceId)))].filter(Boolean)
    )
  ];
  const resources = await Resource.find({ _id: { $in: resourceIds } }).populate('uploaderId', 'name email');
  const resourceMap = new Map(resources.map((r) => [String(r._id), r]));

  // Rows keyed by Payment id — admin updates go to PUT /payments/:id/status
  const paymentTx = payments.flatMap((payment) =>
    payment.items.map((item) => {
      const resource = resourceMap.get(String(item.resourceId));
      return {
        _id: payment._id,
        orderId: payment.orderId,
        itemId: item.resourceId,
        resourceId: item.resourceId,
        title: item.title,
        amount: item.price,
        status: payment.status,
        buyerName: payment.userId?.name || payment.userId?.email || 'Unknown',
        sellerName: resource?.uploaderId?.name || 'Unknown',
        date: payment.createdAt,
        updateRoute: 'payments'
      };
    })
  );

  // Pre-ledger orders: still use PUT /orders/:id/status until backfilled with Payment docs
  const legacyTx = legacyOrders.flatMap((order) =>
    order.items.map((item) => {
      const resource = resourceMap.get(String(item.resourceId));
      return {
        _id: order._id,
        orderId: order._id,
        itemId: item.resourceId,
        resourceId: item.resourceId,
        title: item.title,
        amount: item.price,
        status: order.status,
        buyerName: order.userId?.name || order.userId?.email || 'Unknown',
        sellerName: resource?.uploaderId?.name || 'Unknown',
        date: order.createdAt,
        updateRoute: 'orders'
      };
    })
  );

  const transactions = [...paymentTx, ...legacyTx].sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ payments, transactions });
}

/** Admin: create a manual payment linked to a new pending order (e.g. bank transfer awaiting verification). */
async function createManualPayment(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const { userId, resourceIds, paymentMethod, notes, status } = req.body;
  if (!userId) return res.status(400).json({ message: 'userId is required.' });
  const ids = Array.isArray(resourceIds) ? resourceIds : [];
  if (!ids.length) return res.status(400).json({ message: 'At least one resource id is required.' });

  const buyer = await User.findById(userId);
  if (!buyer) return res.status(404).json({ message: 'Buyer not found.' });

  const resources = await Resource.find({ _id: { $in: ids } });
  if (resources.length !== ids.length) {
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
  const initialStatus = PAYMENT_STATUSES.includes(status) ? status : 'pending';
  const orderStatus = ORDER_SYNC_STATUSES.includes(initialStatus) ? initialStatus : 'pending';

  const order = await Order.create({
    userId: buyer._id,
    items: orderItems,
    totalPrice,
    status: orderStatus
  });

  const payment = await Payment.create({
    userId: buyer._id,
    orderId: order._id,
    items: orderItems,
    totalAmount: totalPrice,
    currency: 'LKR',
    paymentMethod: paymentMethod || 'manual',
    status: initialStatus,
    notes: notes || ''
  });

  res.status(201).json({ message: 'Payment record created.', order, payment });
}

/** Admin: update notes or method; optional status (prefer /status route for status changes). */
async function updatePayment(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const { notes, paymentMethod, currency } = req.body;
  if (notes !== undefined) payment.notes = String(notes).slice(0, 2000);
  if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
  if (currency !== undefined) payment.currency = currency;

  await payment.save();
  res.json({ message: 'Payment updated.', payment });
}

/** Admin: update payment + linked order when status exists on Order; notify on verified / approved tiers. */
async function updatePaymentStatus(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const { status } = req.body;
  if (!PAYMENT_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  const order = await Order.findById(payment.orderId);
  if (!order) return res.status(404).json({ message: 'Linked order not found.' });

  payment.status = status;
  await payment.save();

  if (ORDER_SYNC_STATUSES.includes(status)) {
    order.status = status;
    await order.save();
    await applySellerCreditsIfNeeded(order._id);
    await notifyOrderPaymentStatus(await Order.findById(order._id), status);
  } else if (status === 'refunded') {
    // Payment-only terminal state: mark linked order rejected (Order enum has no "refunded")
    order.status = 'rejected';
    await order.save();
  }

  const orderAfter = await Order.findById(order._id);
  res.json({ message: 'Payment and order status updated.', payment, order: orderAfter });
}

/** Admin: delete payment record (order remains for history; admin can delete order separately if needed). */
async function deletePayment(req, res) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });

  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });

  res.json({ message: 'Payment deleted.', id: req.params.id });
}

module.exports = {
  processPayment,
  listMyPayments,
  getPaymentById,
  getAdminPaymentLedger,
  createManualPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment
};
