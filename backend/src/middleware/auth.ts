import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../common/errors';
import { verifyAccessToken } from '../modules/auth/tokens';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Requires a valid access token. Attaches req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new UnauthorizedError('Invalid token type');
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles };
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/** Requires the authenticated user to hold at least one of the given roles. */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new UnauthorizedError();
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) throw new ForbiddenError();
    next();
  };
}
