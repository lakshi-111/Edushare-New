const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    badge: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
    avatar: { type: String, default: '' },
    uploadCount: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.pre('save', async function savePassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.updateBadge = function updateBadge() {
  if (this.uploadCount >= 20) this.badge = 'Gold';
  else if (this.uploadCount >= 8) this.badge = 'Silver';
  else this.badge = 'Bronze';
};

module.exports = mongoose.model('User', userSchema);
