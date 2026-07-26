'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const db = require('./db');
const requestLogger = require('./middleware/requestLogger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

function createApp() {
  const app = express();

  app.use(helmet());

  const configuredOrigins = String(config.server.corsOrigin || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowAnyOrigin = configuredOrigins.includes('*');
  const allowedOrigins = new Set(configuredOrigins.filter((origin) => origin !== '*'));

  const corsOptions = {
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header) and configured browser origins.
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      callback(null, allowAnyOrigin || allowedOrigins.has(normalizedOrigin));
    },
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger());

  app.get('/health', async (req, res) => {
    try {
      await db.ping();
      res.json({ status: 'ok', database: 'up', timestamp: new Date().toISOString() });
    } catch (err) {
      res
        .status(503)
        .json({ status: 'degraded', database: 'down', timestamp: new Date().toISOString() });
    }
  });

  app.get('/', (req, res) => {
    res.json({
      name: 'Course Registration Dashboard API',
      environment: config.env,
      api: '/api',
      health: '/health',
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
