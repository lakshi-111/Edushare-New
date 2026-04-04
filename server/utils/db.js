const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer = null;

async function connectDatabase() {
  const providedUri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();

  try {
    const mongoUri = providedUri || await startMemoryServer();
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB connected: ${providedUri ? 'external database' : 'in-memory database'}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (providedUri) {
      console.log('Attempting fallback to in-memory database...');
      try {
        const fallbackUri = await startMemoryServer();
        await mongoose.connect(fallbackUri);
        console.log('✅ Fallback: MongoDB connected to in-memory database');
      } catch (fallbackError) {
        console.error('❌ Fallback MongoDB connection failed:', fallbackError.message);
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
}

async function startMemoryServer() {
  if (!memoryServer) {
    memoryServer = await MongoMemoryServer.create();
  }
  return memoryServer.getUri();
}

module.exports = { connectDatabase };
