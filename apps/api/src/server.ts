import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config, validateConfig } from './config/index.js';
import { testDatabaseConnection } from './config/database.js';
import logger from './config/logger.js';
import { 
  errorHandler, 
  notFoundHandler, 
  generalRateLimit 
} from './middleware/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import rewardsRoutes from './routes/rewards.js';
import transactionsRoutes from './routes/transactions.js';
import usersRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';

async function createApp(): Promise<express.Application> {
  const app = express();

  // Trust proxy for rate limiting and IP detection
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", config.solana.rpcUrl],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.api.cors.origin,
    credentials: config.api.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));

  // Compression middleware
  app.use(compression());

  // Request parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: (req) => req.url === '/health' || req.url === '/health/ready',
  }));

  // Request ID middleware
  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] as string || 
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // Rate limiting
  app.use(generalRateLimit);

  // API routes
  app.use('/api/v1/health', healthRoutes);
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/rewards', rewardsRoutes);
  app.use('/api/v1/transactions', transactionsRoutes);
  app.use('/api/v1/users', usersRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'Reward System API',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Create Express app
    const app = await createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`, {
        port: config.port,
        environment: config.nodeEnv,
        apiUrl: `http://localhost:${config.port}`,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(() => {
        logger.info('Server closed successfully');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();