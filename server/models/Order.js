const mongoose = require('mongoose');

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
    status: { type: String, enum: ['pending', 'verified', 'approved', 'paid', 'completed', 'rejected'], default: 'pending' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
