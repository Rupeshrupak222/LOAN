import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export async function listSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
}

export async function getSettingByKey(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) throw new NotFoundError(`Setting ${key} not found`);
  return setting;
}

export async function updateSetting(key: string, value: any, actorUserId?: string) {
  const existing = await prisma.systemSetting.findUnique({ where: { key } });

  const updated = await prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  await logAudit({
    userId: actorUserId,
    action: 'SYSTEM_SETTING_UPDATED',
    entity: 'SystemSetting',
    entityId: key,
    previousValue: existing?.value,
    newValue: value,
  });

  return updated;
}
