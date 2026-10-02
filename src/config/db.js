const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tapzy_outreach_crm', {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to local MongoDB (${error.message}). In-memory / mock storage fallback ready.`);
    return null;
  }
};

module.exports = connectDB;
