const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Answered', 'Closed'], default: 'Pending' },
    answer: { type: String, default: '' },
    answeredAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
