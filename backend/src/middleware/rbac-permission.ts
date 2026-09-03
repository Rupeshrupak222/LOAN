import { Request, Response, NextFunction } from 'express';
import { PermissionCode } from '../modules/roles/permission.types';
import { rolePermissionService } from '../modules/roles/role-permission.service';
import { ForbiddenError, UnauthorizedError } from '../common/errors';

export function requirePermission(
  permission: PermissionCode,
  options?: { sanctionAmountField?: string }
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required to access this resource.');
    }

    let requiredSanctionAmount: number | undefined;
    if (options?.sanctionAmountField) {
      const val = req.body?.[options.sanctionAmountField] || req.query?.[options.sanctionAmountField];
      if (typeof val === 'number') {
        requiredSanctionAmount = val;
      }
    }

    const authorized = rolePermissionService.hasPermission(req.user, permission, {
      requiredSanctionAmount,
    });

    if (!authorized) {
      throw new ForbiddenError(
        `Access forbidden: Missing required permission '${permission}' or insufficient financial sign-off authority.`
      );
    }

    next();
  };
}
