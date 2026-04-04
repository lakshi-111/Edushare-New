const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, enum: ['bad language', 'wrong information', 'spam', 'harassment', 'other'], required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
    timestamp: { type: Date, default: Date.now },
    adminNote: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);