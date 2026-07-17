const dns = require('node:dns/promises'); 
dns.setServers(["1.1.1.1", "8.8.8.8"]); 
require('dotenv').config();

const app        = require('./app');
const connectDB  = require('./config/db');
const logger     = require('./utils/logger');

const PORT = process.env.PORT || 5000;

connectDB();

// Initialize BullMQ workers on startup if Redis is configured
if (process.env.REDIS_URL) {
  try {
    const { initWorker: initBookWorker } = require('./workers/hotels/hotel-book.worker');
    const { initWorker: initPollWorker } = require('./workers/hotels/hotel-poll-status.worker');
    initBookWorker();
    initPollWorker();
    logger.info('🤖 BullMQ Hotel Workers initialized successfully.');
  } catch (err) {
    logger.error(`Failed to initialize BullMQ Workers: ${err.message}`);
  }
}

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

