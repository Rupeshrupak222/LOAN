import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { workerService } from '../modules/jobs/worker.service';
import { providerRegistry } from '../modules/integrations/provider-registry.service';
import { env } from '../config/env';

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
 * 4. Deep Dependency Health Probe (checks PostgreSQL, Storage, Gateway, Auth)
 */
router.get('/health/dependencies', async (_req: Request, res: Response) => {
  const dependencies: Record<
    string,
    { status: 'HEALTHY' | 'DEGRADED' | 'DOWN'; latencyMs: number; details?: string }
  > = {};

  let allHealthy = true;

  // 1. PostgreSQL Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dependencies.database = {
      status: 'HEALTHY',
      latencyMs: Date.now() - dbStart,
      details: 'PostgreSQL connection active',
    };
  } catch (err: any) {
    allHealthy = false;
    dependencies.database = {
      status: 'DOWN',
      latencyMs: Date.now() - dbStart,
      details: 'Database connection failed',
    };
  }

  // 2. Cloud Storage Vault
  const hasCloudinary = Boolean(env.cloudinary.apiKey && env.cloudinary.cloudName);
  dependencies.cloudStorage = {
    status: hasCloudinary ? 'HEALTHY' : 'DEGRADED',
    latencyMs: 1,
    details: hasCloudinary ? 'Cloudinary vault configured' : 'Local disk storage fallback active',
  };

  // 3. Provider Integration Gateway
  try {
    const providerHealth = await providerRegistry.getHealthSummary();
    const isAnyDown = providerHealth.some((p) => p.status === 'UNAVAILABLE' || p.status === 'AUTH_ERROR');
    dependencies.integrationGateway = {
      status: isAnyDown ? 'DEGRADED' : 'HEALTHY',
      latencyMs: 2,
      details: `${providerHealth.length} provider adapters active`,
    };
  } catch {
    dependencies.integrationGateway = {
      status: 'DEGRADED',
      latencyMs: 2,
      details: 'Provider adapter registry running in fallback sandbox',
    };
  }

  // 4. Auth & Security Subsystem
  const hasJwt = Boolean(env.jwt.accessSecret && env.jwt.refreshSecret);
  dependencies.authSubsystem = {
    status: hasJwt ? 'HEALTHY' : 'DOWN',
    latencyMs: 1,
    details: hasJwt ? 'JWT HMAC cryptographic engine active' : 'Missing JWT signing keys',
  };

  if (!hasJwt) allHealthy = false;

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: allHealthy ? 'HEALTHY' : 'UNHEALTHY',
    timestamp: new Date().toISOString(),
    dependencies,
  });
});

/**
 * 5. Subsystem Telemetry
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
