const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    isReported: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    status: { type: String, enum: ['approved', 'flagged', 'reported', 'deleted', 'edited'], default: 'approved' },
    reportCount: { type: Number, default: 0 },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    editedContent: { type: String }, // Original content if edited
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who edited
    editedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
