import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

// Liveness
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adyapan-lms-backend', time: new Date().toISOString() });
});

// Readiness - checks DB connectivity
router.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

export default router;
