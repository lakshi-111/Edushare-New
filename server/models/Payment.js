const mongoose = require('mongoose');

/**
 * Financial record tied 1:1 to an Order (unique orderId). Mirrors order line items and status;
 * used by /payments APIs and admin ledger; kept in sync when order status changes from admin routes.
 */
const paymentItemSchema = new mongoose.Schema(
  {
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    items: { type: [paymentItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    paymentMethod: { type: String, required: true },
    cardLast4: { type: String },
    status: {
      type: String,
      enum: ['pending', 'verified', 'approved', 'paid', 'completed', 'failed', 'rejected', 'refunded'],
      default: 'pending'
    },
    notes: { type: String, maxlength: 2000 }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
