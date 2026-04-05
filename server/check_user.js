require('dotenv').config();
const { connectDatabase } = require('./utils/db');
const User = require('./models/User');
(async () => {
  try {
    await connectDatabase();
    const u = await User.findOne({ email: 'nimali@example.com' }).select('+password').lean();
    if (!u) console.log('USER_NOT_FOUND');
    else console.log('FOUND', JSON.stringify({ email: u.email, passwordPresent: !!u.password, role: u.role, banned: u.banned, violationCount: u.violationCount, strikes: u.strikes }));
  } catch (err) {
    console.error('ERR', err.message);
  }
})();
