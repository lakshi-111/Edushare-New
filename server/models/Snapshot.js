const mongoose = require('mongoose');

const snapshotSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalUsers: { type: Number, default: 0 },
    activeStudents: { type: Number, default: 0 },
    totalResources: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Create index on date for efficient queries
snapshotSchema.index({ date: 1 });

module.exports = mongoose.model('Snapshot', snapshotSchema);