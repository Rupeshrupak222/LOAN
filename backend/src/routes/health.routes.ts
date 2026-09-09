import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { workerService } from '../modules/jobs/worker.service';

const router = Router();

/**
 * 1. Liveness Probe (process responsive)
 */
router.get(['/health', '/health/live'], (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    service: 'adyapan-lms-backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

/**
 * 2. Readiness Probe (checks DB connectivity, worker capacity, memory)
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  const subsystems: Record<string, 'UP' | 'DOWN' | 'DEGRADED'> = {
    database: 'UP',
    workerPool: 'UP',
  };

  let isReady = true;

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    subsystems.database = 'DOWN';
    isReady = false;
  }

  // Check Worker Pool
  try {
    const metrics = workerService.getMetrics();
    if (metrics.deadLetter > 50) {
      subsystems.workerPool = 'DEGRADED';
    }
  } catch {
    subsystems.workerPool = 'DOWN';
  }

  const mem = process.memoryUsage();
  const memoryMb = {
    rss: Math.round(mem.rss / (1024 * 1024)),
    heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
  };

  if (!isReady) {
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      subsystems,
      memoryMb,
    });
    return;
  }

  res.json({
    status: 'READY',
    timestamp: new Date().toISOString(),
    subsystems,
    memoryMb,
  });
});

/**
 * 3. Startup Probe (initial boot validation)
 */
router.get('/health/startup', (_req: Request, res: Response) => {
  res.json({
    status: 'BOOTED',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
  });
});

/**
 * 4. Subsystem Telemetry
 */
router.get('/health/telemetry', async (_req: Request, res: Response) => {
  const workerMetrics = workerService.getMetrics();
  const mem = process.memoryUsage();

  res.json({
    success: true,
    data: {
      uptimeSeconds: Math.floor(process.uptime()),
      workerMetrics,
      memory: {
        rssMb: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      },
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
  });
});

export default router;
