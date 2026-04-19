const mongoose = require('mongoose');

/**
 * Purchase / checkout order.
 * Paid checkouts start as status "pending" until an admin advances them; sellerEarningsApplied
 * ensures User.totalEarnings is incremented only once when the order first reaches an approved status.
 */
const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        fileUrl: { type: String, required: true },
        fileName: { type: String, required: true }
      }
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'verified', 'approved', 'paid', 'completed', 'rejected'], default: 'pending' },
    /** Prevents applying seller User.totalEarnings increments more than once for this order. */
    sellerEarningsApplied: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
