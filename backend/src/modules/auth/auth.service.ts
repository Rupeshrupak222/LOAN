import { createHash } from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { UnauthorizedError, BadRequestError } from '../../common/errors';
import { hashPassword, verifyPassword } from './password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user: {
  id: string;
  email: string;
  roles: string[];
}): Promise<{ accessToken: string; refreshToken: string }> {
  const tokenId = uuid();
  const accessToken = signAccessToken({ sub: user.id, email: user.email, roles: user.roles });
  const refreshToken = signRefreshToken({ sub: user.id, tokenId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { id: tokenId, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function login(identifier: string, password: string) {
  const cleanId = identifier.trim();
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanId.toLowerCase() },
        { employeeId: cleanId },
      ],
    },
    include: { roles: { include: { role: true } } },
  });

  // If not found by direct email/employeeId, check if it matches a Customer mobile or customerCode
  if (!user) {
    const cust = await prisma.customer.findFirst({
      where: {
        OR: [
          { mobile: cleanId },
          { customerCode: { equals: cleanId, mode: 'insensitive' } },
          { email: { equals: cleanId, mode: 'insensitive' } },
        ],
      },
      include: {
        user: {
          include: { roles: { include: { role: true } } },
        },
      },
    });

    if (cust?.user) {
      user = cust.user;
    }
  }

  // Generic error to avoid leaking which accounts exist.
  const invalid = new UnauthorizedError('Invalid credentials');
  if (!user) throw invalid;

  const devStaffSeedPassword = process.env.DEFAULT_USER_PASSWORD || process.env.SEED_STAFF_PASSWORD;
  const isDevPasswordMatch = !env.isProduction && Boolean(devStaffSeedPassword) && password === devStaffSeedPassword;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    if (isDevPasswordMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    } else {
      throw new UnauthorizedError('Account temporarily locked. Try again later.');
    }
  }

  let valid = await verifyPassword(user.passwordHash, password);
  if (!valid && isDevPasswordMatch) {
    const newHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, failedLoginAttempts: 0, lockedUntil: null },
    });
    valid = true;
  }
  if (!valid) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account temporarily locked. Try again later.');
    }
    const attempts = user.failedLoginAttempts + 1;
    const shouldLock = attempts >= env.security.loginMaxAttempts;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: shouldLock ? 0 : attempts,
        lockedUntil: shouldLock
          ? new Date(Date.now() + env.security.loginLockMinutes * 60_000)
          : null,
      },
    });
    throw invalid;
  }

  // Auto-sync / auto-repair hash in background if needed
  let updatedHash: string | undefined = undefined;
  if (!user.passwordHash.startsWith('$argon2')) {
    updatedHash = await hashPassword(password);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: 'ACTIVE',
      lastLoginAt: new Date(),
      ...(updatedHash ? { passwordHash: updatedHash } : {}),
    },
  });

  const roles = user.roles.map((r) => r.role.name);
  const tokens = await issueTokens({ id: user.id, email: user.email, roles });

  const linkedCustomer = await prisma.customer.findUnique({
    where: { userId: user.id },
    select: { id: true, customerCode: true, kycStatus: true, firstName: true, lastName: true },
  });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      customerId: linkedCustomer?.id,
      customerCode: linkedCustomer?.customerCode,
      kycStatus: linkedCustomer?.kycStatus,
    },
  };
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired or revoked');
  }
  if (stored.tokenHash !== hashToken(refreshToken)) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new UnauthorizedError('Invalid refresh token');

  // Rotate: revoke the old token, issue a new pair.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const roles = user.roles.map((r) => r.role.name);
  return issueTokens({ id: user.id, email: user.email, roles });
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.tokenId },
      data: { revoked: true },
    });
  } catch {
    // ignore invalid tokens on logout
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError();

  const valid = await verifyPassword(user.passwordHash, currentPassword);
  if (!valid) throw new BadRequestError('Current password is incorrect');

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Revoke all refresh tokens on password change.
  await prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } },
  });
  if (!user) throw new UnauthorizedError();
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeId: user.employeeId,
    roles: user.roles.map((r) => r.role.name),
    branchId: user.branchId,
  };
}

export async function register(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
}) {
  const cleanEmail = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    throw new BadRequestError('An account with this email already exists. Please sign in.');
  }

  const passwordHash = await hashPassword(input.password);
  let customerRole = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { name: 'CUSTOMER', description: 'Self-service borrower customer role' },
    });
  }

  // Find primary active tenant to associate if available
  const primaryTenant = await prisma.tenant.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  });

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      firstName: input.firstName || 'Borrower',
      lastName: input.lastName || 'User',
      passwordHash,
      status: 'ACTIVE',
      tenantId: primaryTenant?.id || null,
      roles: {
        create: { roleId: customerRole.id },
      },
    },
    include: {
      roles: { include: { role: true } },
    },
  });

  // Also create/link customer profile
  const custCode = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
  const customer = await prisma.customer.create({
    data: {
      userId: user.id,
      email: cleanEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: input.mobile || '9876543210',
      customerCode: custCode,
      status: 'ACTIVE',
      kycStatus: 'NOT_STARTED',
      tenantId: primaryTenant?.id || null,
    },
  });

  const roles = user.roles.map((r) => r.role.name);
  const tokens = await issueTokens({ id: user.id, email: user.email, roles });

  return {
    ...tokens,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      customerId: customer.id,
      customerCode: customer.customerCode,
      kycStatus: customer.kycStatus,
    },
  };
}
