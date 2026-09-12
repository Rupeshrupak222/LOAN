/**
 * Phase 16: Workspace, Navigation & Portal Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { workspaceService } from './workspace.service';
import { WorkspaceKey } from './workspace.types';

const router = Router();

const switchWorkspaceSchema = z.object({
  workspaceKey: z.string().min(1),
});

/**
 * GET /api/v1/workspaces/context
 * Returns current user's full access context, department, authorized portals, available workspaces, and dynamic navigation
 */
router.get('/context', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId || undefined;
    const context = await workspaceService.getUserAccessContext(userId, tenantId);
    res.json({
      success: true,
      data: context,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/workspaces/switch
 * Switches the active workspace for the authenticated user (after server-side authorization check)
 */
router.post('/switch', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceKey } = switchWorkspaceSchema.parse(req.body);
    const updatedContext = await workspaceService.switchActiveWorkspace(userId, workspaceKey as WorkspaceKey);
    res.json({
      success: true,
      data: updatedContext,
      message: `Active workspace switched to ${updatedContext.activeWorkspace.name}`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
