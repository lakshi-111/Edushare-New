const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
      type: String,
      enum: ['incorrect_or_misleading_information', 'inappropriate_language', 'spam_or_advertising', 'harassment_or_personal_attack', 'other'],
      required: true
    },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    timestamp: { type: Date, default: Date.now },
    adminNote: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);