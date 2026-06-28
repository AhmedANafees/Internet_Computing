'use strict';

const createApp = require('./app');
const config = require('./config');
const db = require('./db');
const logger = require('./utils/logger');

async function start() {
  const app = createApp();

  try {
    await db.ping();
    logger.info('Connected to MySQL database:', config.db.database);
  } catch (err) {
    logger.warn('Could not reach the database at startup. The server will start anyway.');
    logger.warn('Database error:', err.message);
  }

  const server = app.listen(config.server.port, () => {
    logger.info(`Server listening on port ${config.server.port} (${config.env})`);
  });

  async function shutdown(signal) {
    logger.info(`Received ${signal}. Shutting down gracefully.`);
    server.close(async () => {
      try {
        await db.close();
        logger.info('Database pool closed. Goodbye.');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
