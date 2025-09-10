import { Router, Request, Response } from 'express';
import { supabase } from '../config/database.js';
import { connection } from '../utils/solana.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/index.js';

const router = Router();

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: 'healthy' | 'unhealthy';
    solana: 'healthy' | 'unhealthy';
  };
  environment: string;
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function checkSolanaHealth(): Promise<boolean> {
  try {
    await connection.getVersion();
    return true;
  } catch {
    return false;
  }
}

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const [databaseHealthy, solanaHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkSolanaHealth(),
  ]);

  const healthCheck: HealthCheckResult = {
    status: databaseHealthy && solanaHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: {
      database: databaseHealthy ? 'healthy' : 'unhealthy',
      solana: solanaHealthy ? 'healthy' : 'unhealthy',
    },
    environment: config.nodeEnv,
  };

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    data: healthCheck,
    success: healthCheck.status === 'healthy',
  });
}));

router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  const databaseHealthy = await checkDatabaseHealth();
  
  if (databaseHealthy) {
    res.status(200).json({
      data: {
        status: 'ready',
        timestamp: new Date().toISOString(),
      },
      success: true,
    });
  } else {
    res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
      },
    });
  }
}));

router.get('/live', asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    data: {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    success: true,
  });
}));

export default router;