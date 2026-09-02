import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { uploadBufferToCloudinary } from '../../config/cloudinary';
import type { RegisterDocumentInput, VerifyDocumentInput } from './document.schema';

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function listDocuments(customerId?: string, applicationId?: string, userId?: string) {
  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (applicationId) where.applicationId = applicationId;
  if (userId) where.customer = { userId };

  return prisma.document.findMany({
    where,
    include: {
      customer: { select: { firstName: true, lastName: true, customerCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDocument(id: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: {
      customer: { select: { firstName: true, lastName: true, customerCode: true, userId: true } },
      application: { select: { applicationNo: true } },
    },
  });
  if (!doc) throw new NotFoundError('Document not found');
  return doc;
}

/**
 * Upload a binary file / photo directly to Cloudinary and register in Document vault
 */
export async function uploadAndRegisterDocument(
  file: Express.Multer.File,
  metadata: {
    customerId: string;
    applicationId?: string;
    category: string;
    documentType?: string;
    expiryDate?: string;
  },
  actorUserId?: string
) {
  if (!file || !file.buffer) {
    throw new BadRequestError('No file buffer received for upload');
  }

  // 1. Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: metadata.customerId },
  });
  if (!customer) {
    throw new NotFoundError('Borrower customer record not found');
  }

  // 2. Determine folder name based on category
  const folder = metadata.category === 'APPLICANT_PHOTO'
    ? 'adyapan_lms/customer_photos'
    : 'adyapan_lms/kyc_documents';

  const cleanCustCode = customer.customerCode || customer.id.slice(0, 8);
  const cleanType = (metadata.documentType || metadata.category || 'DOC')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_');
  const publicId = `${cleanCustCode}_${cleanType}_${Date.now()}`;

  // 3. Attempt upload to Cloudinary with local storage fallback
  let fileStorageUrl = '';
  let uploadedPublicId = publicId;
  const isImage = file.mimetype.startsWith('image/');

  try {
    const cloudinaryResult = await uploadBufferToCloudinary(file.buffer, {
      folder,
      publicId,
      resourceType: isImage ? 'image' : 'auto',
      tags: ['adyapan_lms', 'kyc', cleanCustCode],
      mimeType: file.mimetype,
    });
    fileStorageUrl = cloudinaryResult.secure_url;
    uploadedPublicId = cloudinaryResult.public_id;
  } catch (err: any) {
    // Graceful fallback to local uploads directory if Cloudinary is unreachable or times out
    const fs = await import('fs');
    const path = await import('path');
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || (isImage ? '.jpg' : '.pdf');
    const localFileName = `${cleanCustCode}_${Date.now()}${ext}`;
    const localFilePath = path.join(uploadsDir, localFileName);
    fs.writeFileSync(localFilePath, file.buffer);
    fileStorageUrl = `/uploads/documents/${localFileName}`;
  }

  // 4. Save to Database
  const doc = await prisma.document.create({
    data: {
      customerId: metadata.customerId,
      applicationId: metadata.applicationId || null,
      category: metadata.category,
      documentType: metadata.documentType || metadata.category,
      fileName: file.originalname,
      storageKey: fileStorageUrl,
      contentType: file.mimetype,
      sizeBytes: file.size || file.buffer.length,
      expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : null,
      status: 'PENDING',
      verified: false,
    },
    include: {
      customer: { select: { firstName: true, lastName: true, customerCode: true } },
    },
  });

  // 5. Audit Log
  await logAudit({
    userId: actorUserId,
    action: 'DOCUMENT_UPLOADED',
    entity: 'Document',
    entityId: doc.id,
    newValue: {
      fileName: doc.fileName,
      category: doc.category,
      type: doc.documentType,
      storageUrl: fileStorageUrl,
      publicId: uploadedPublicId,
    },
  });

  return doc;
}

export async function registerDocument(input: RegisterDocumentInput, actorUserId?: string) {
  const ext = input.fileName.slice(input.fileName.lastIndexOf('.')).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new BadRequestError(`Invalid document format (${ext}). Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  if (input.sizeBytes && input.sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestError(`File exceeds maximum permissible size of 10MB`);
  }

  const doc = await prisma.document.create({
    data: {
      customerId: input.customerId,
      applicationId: input.applicationId,
      category: input.category,
      documentType: input.documentType,
      fileName: input.fileName,
      storageKey: input.storageKey,
      contentType: input.contentType || 'application/octet-stream',
      sizeBytes: input.sizeBytes || 1024,
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

export async function deleteDocument(id: string, actorUserId?: string) {
  const existing = await getDocument(id);
  await prisma.document.delete({ where: { id } });

  await logAudit({
    userId: actorUserId,
    action: 'DOCUMENT_DELETED',
    entity: 'Document',
    entityId: id,
    previousValue: { fileName: existing.fileName, customerId: existing.customerId },
  });

  return { success: true };
}
