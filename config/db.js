const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const isSrvUri = typeof mongoUri === 'string' && mongoUri.startsWith('mongodb+srv://');

  const connectOnce = async () => {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    try {
      const dbName = conn.connection.name || (mongoose.connection.db && mongoose.connection.db.databaseName) || 'unknown';
      console.log(` MongoDB database: ${dbName}`);
    } catch (e) {
      // ignore
    }

    mongoose.connection.on('error', (err) => {
      console.error(` MongoDB error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(' MongoDB disconnected');
    });
  };

  try {
    await connectOnce();
  } catch (error) {
    if (isSrvUri && error.message.includes('ECONNREFUSED')) {
      console.warn(' MongoDB SRV lookup failed with local DNS resolver. Retrying with public DNS servers.');
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      await connectOnce();
      return;
    }

    console.error(` MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
