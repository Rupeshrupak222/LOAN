import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type { RegisterDocumentInput, VerifyDocumentInput } from './document.schema';

export async function listDocuments(customerId?: string, applicationId?: string) {
  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (applicationId) where.applicationId = applicationId;

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      customer: { select: { firstName: true, lastName: true, customerCode: true } },
      application: { select: { applicationNo: true } },
    },
  });
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

export async function registerDocument(input: RegisterDocumentInput, actorUserId?: string) {
  const doc = await prisma.document.create({
    data: {
      customerId: input.customerId,
      applicationId: input.applicationId,
      category: input.category,
      documentType: input.documentType,
      fileName: input.fileName,
      storageKey: input.storageKey,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      expiryDate: input.expiryDate,
      status: 'PENDING',
      verified: false,
    },
  });

  await logAudit({
    userId: actorUserId,
    action: 'DOCUMENT_UPLOADED',
    entity: 'Document',
    entityId: doc.id,
    newValue: { fileName: doc.fileName, category: doc.category, type: doc.documentType },
  });

  return doc;
}

export async function verifyDocument(
  id: string,
  input: VerifyDocumentInput,
  actorEmail?: string,
  actorUserId?: string
) {
  const existing = await getDocument(id);
  const isVerified = input.status === 'VERIFIED';

  const updated = await prisma.document.update({
    where: { id },
    data: {
      status: input.status,
      verified: isVerified,
      rejectionReason: input.rejectionReason,
      verifiedBy: actorEmail,
      verifiedAt: new Date(),
    },
  });

  await logAudit({
    userId: actorUserId,
    action: 'DOCUMENT_VERIFIED',
    entity: 'Document',
    entityId: id,
    previousValue: { status: existing.status, verified: existing.verified },
    newValue: { status: input.status, verified: isVerified, verifiedBy: actorEmail },
  });

  return updated;
}
