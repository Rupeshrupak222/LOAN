import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env';
import { logger } from './logger';

// Configure Cloudinary SDK with provided credentials
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
  secure: true,
});

export { cloudinary };

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'auto' | 'image' | 'raw' | 'video';
    tags?: string[];
    mimeType?: string;
  } = {}
): Promise<UploadApiResponse> {
  const {
    folder = 'adyapan_lms/kyc_documents',
    publicId,
    resourceType = 'auto',
    tags = ['adyapan_lms', 'kyc'],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        tags,
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, 'Cloudinary upload stream failed');
          return reject(error || new Error('Cloudinary upload returned empty result'));
        }
        logger.info(
          { public_id: result.public_id, secure_url: result.secure_url, bytes: result.bytes },
          'File successfully uploaded to Cloudinary'
        );
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'raw' = 'image') {
  try {
    const res = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return res;
  } catch (err) {
    logger.error({ err, publicId }, 'Failed to destroy Cloudinary asset');
    throw err;
  }
}
