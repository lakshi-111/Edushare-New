const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['FOLLOW', 'MENTORSHIP', 'COLLABORATION'], default: 'FOLLOW' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
    message: { type: String, default: '' }
  },
  { timestamps: true }
);

connectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
