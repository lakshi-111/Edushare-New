const mongoose = require('mongoose');

/**
 * Persisted seller payout when "Withdraw" is used on /billing: amount, which orders were settled,
 * and timestamps for history (GET /orders/my-withdrawals).
 */
const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'LKR' },
    /** Orders whose seller-available balance was settled by this withdrawal. */
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    status: {
      type: String,
      enum: ['completed', 'processing', 'failed'],
      default: 'completed'
    }
  },
  { timestamps: true }
);

withdrawalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
