import { BaseAdapter } from '../base.adapter';
import { IntegrationCategory, ProviderConfig } from '../../integration.types';
import { getProviderConfigurations } from '../../integration.config';
import { env } from '../../../../config/env';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../../../../config/cloudinary';

export class DocumentStorageAdapter extends BaseAdapter {
  readonly providerId = 'document_storage';
  readonly name = 'Document Storage Vault (Cloudinary Encrypted CDN)';
  readonly category: IntegrationCategory = 'DOCUMENT';
  config: ProviderConfig;

  constructor(customConfig?: Partial<ProviderConfig>) {
    super();
    this.config = {
      ...getProviderConfigurations().document_storage,
      ...customConfig,
    };
  }

  protected async executeAction<T = any>(
    action: string,
    payload: any,
    correlationId: string,
    signal: AbortSignal
  ): Promise<{ data?: T; providerRequestId?: string; rawStatus?: string }> {
    if (action === 'UPLOAD_DOCUMENT') {
      const { buffer, options } = payload || {};
      const res = await uploadBufferToCloudinary(buffer, options);
      return {
        data: res as any,
        providerRequestId: res.public_id,
        rawStatus: 'UPLOADED',
      };
    }

    if (action === 'DELETE_DOCUMENT') {
      const { publicId, resourceType } = payload || {};
      const res = await deleteFromCloudinary(publicId, resourceType);
      return {
        data: res as any,
        providerRequestId: publicId,
        rawStatus: 'DELETED',
      };
    }

    // Default: PING / Health Check
    return {
      data: {
        cloudName: env.cloudinary.cloudName,
        status: 'CONNECTED',
      } as any,
      providerRequestId: `CLD-PING-${Date.now()}`,
      rawStatus: 'OK',
    };
  }
}
