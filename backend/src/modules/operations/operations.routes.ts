import { Router } from 'express';
import { operationsController } from './operations.controller';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac-permission';

const router = Router();

// All operations routes require authentication
router.use(authenticate);

// 1. Operations Overview Cockpit
router.get('/overview', requirePermission('APPLICATIONS_VIEW'), (req, res, next) =>
  operationsController.getOverview(req, res).catch(next)
);

// 2. Applications Directory (Server-side search, multi-filters, pagination)
router.get('/applications', requirePermission('APPLICATIONS_VIEW'), (req, res, next) =>
  operationsController.listApplications(req, res).catch(next)
);

// 3. Application Detail
router.get('/applications/:id', requirePermission('APPLICATIONS_VIEW'), (req, res, next) =>
  operationsController.getApplicationDetails(req, res).catch(next)
);

// 4. Create Application (Controlled Origination)
router.post('/applications', requirePermission('APPLICATIONS_CREATE'), (req, res, next) =>
  operationsController.createApplication(req, res).catch(next)
);

// 5. Submit Application
router.post('/applications/:id/submit', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.submitApplication(req, res).catch(next)
);

// 6. Transition Stage
router.post('/applications/:id/stage', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.transitionStage(req, res).catch(next)
);

// 7. Assign Application
router.post('/applications/:id/assign', requirePermission('APPLICATIONS_ASSIGN'), (req, res, next) =>
  operationsController.assignApplication(req, res).catch(next)
);

// 8. Update Priority
router.post('/applications/:id/priority', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.updatePriority(req, res).catch(next)
);

// 9. Team Queue & Claiming
router.get('/queue', requirePermission('APPLICATIONS_VIEW'), (req, res, next) =>
  operationsController.getTeamQueue(req, res).catch(next)
);
router.post('/queue/:id/claim', requirePermission('APPLICATIONS_ASSIGN'), (req, res, next) =>
  operationsController.claimQueueItem(req, res).catch(next)
);

// 10. Documents Verification
router.post('/documents/:id/verify', requirePermission('VIEW_DOCUMENTS'), (req, res, next) =>
  operationsController.verifyDocument(req, res).catch(next)
);

// 11. Customer Directory & Customer 360
router.get('/customers', requirePermission('VIEW_CUSTOMER_DETAILS'), (req, res, next) =>
  operationsController.listCustomers(req, res).catch(next)
);
router.get('/customers/:id', requirePermission('VIEW_CUSTOMER_DETAILS'), (req, res, next) =>
  operationsController.getCustomer360(req, res).catch(next)
);

// 12. Tasks (My Tasks & Task Actions)
router.get('/tasks/my', requirePermission('APPLICATIONS_VIEW'), (req, res, next) =>
  operationsController.listMyTasks(req, res).catch(next)
);
router.post('/tasks', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.createTask(req, res).catch(next)
);
router.patch('/tasks/:id/status', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.updateTaskStatus(req, res).catch(next)
);

// 13. Activity Timeline Notes
router.post('/applications/:id/activity', requirePermission('APPLICATIONS_REVIEW'), (req, res, next) =>
  operationsController.addActivityNote(req, res).catch(next)
);

export default router;
