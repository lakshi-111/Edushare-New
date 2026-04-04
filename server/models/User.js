const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    isBlocked: { type: Boolean, default: false },
    badge: { type: String, enum: ['Bronze', 'Silver', 'Gold'], default: 'Bronze' },
    ratingBadge: { type: String, enum: ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Unranked' },
    studentId: { type: String, trim: true, default: '' },
    faculty: { type: String, trim: true, default: '' },
    academicYear: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    uploadCount: { type: Number, default: 0 },
    totalDownloads: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    banned: { type: Boolean, default: false },
    violationCount: { type: Number, default: 0 },
    strikes: { type: Number, default: 0 }
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
