import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export async function listSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
}

export async function getSettingByKey(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) throw new NotFoundError(`Setting ${key} not found`);
  return setting;
}

export async function updateSetting(
  key: string,
  value: any,
  actor?: { id?: string; roles?: string[]; tenantId?: string }
) {
  const isSuperAdmin = actor?.roles?.includes('SUPER_ADMIN');
  const isCompanyAdmin = actor?.roles?.includes('COMPANY_ADMIN') || actor?.roles?.includes('ADMIN');

  if (actor && !isSuperAdmin && !isCompanyAdmin) {
    throw new ForbiddenError('Access forbidden: Only Administrators can modify system settings');
  }

  // Critical financial & underwriting settings are strictly restricted to Super Admin
  const RESTRICTED_GLOBAL_SETTINGS = ['payment_allocation_order', 'approval_limits'];
  if (RESTRICTED_GLOBAL_SETTINGS.includes(key) && !isSuperAdmin) {
    throw new ForbiddenError(
      `Access forbidden: Setting '${key}' constitutes core institutional financial governance and can only be altered by Super Administrators.`
    );
  }

  const existing = await prisma.systemSetting.findUnique({ where: { key } });

  const updated = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  await logAudit({
    userId: actor?.id,
    role: actor?.roles?.[0],
    action: 'SYSTEM_SETTING_UPDATED',
    entity: 'SystemSetting',
    entityId: key,
    previousValue: existing?.value,
    newValue: value,
  });

  return updated;
}
