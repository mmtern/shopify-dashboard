// src/lib/storage/stub-provider.ts
// Stub storage provider for development. Logs operations, returns placeholders.
// Replace with real provider (e.g. Cloudflare R2) when connecting storage.

import type { StorageProvider, UploadInitResult, UploadCompleteResult, DownloadUrlResult } from './types'

export class StubStorageProvider implements StorageProvider {
  readonly name = 'stub'

  async initializeUpload(params: {
    key: string
    contentType: string
    fileSizeBytes?: number
  }): Promise<UploadInitResult> {
    console.log(`[StubStorage] initializeUpload: ${params.key} (${params.contentType}, ${params.fileSizeBytes ?? '?'} bytes)`)
    return {
      uploadId: `stub-upload-${Date.now()}`,
      uploadUrl: null, // No real upload URL — storage not connected
      config: { provider: 'stub' },
    }
  }

  async completeUpload(params: {
    uploadId: string
    key: string
  }): Promise<UploadCompleteResult> {
    console.log(`[StubStorage] completeUpload: ${params.uploadId} → ${params.key}`)
    return {
      storageKey: params.key,
      provider: this.name,
    }
  }

  async getDownloadUrl(params: {
    key: string
    expiresInSeconds?: number
  }): Promise<DownloadUrlResult> {
    console.log(`[StubStorage] getDownloadUrl: ${params.key}`)
    return {
      url: `#storage-not-connected:${params.key}`,
      expiresAt: new Date(Date.now() + (params.expiresInSeconds || 3600) * 1000),
    }
  }

  async deleteFile(params: { key: string }): Promise<void> {
    console.log(`[StubStorage] deleteFile: ${params.key}`)
  }

  async replaceFile(params: {
    oldKey: string
    newKey: string
    contentType: string
    fileSizeBytes?: number
  }): Promise<UploadInitResult> {
    console.log(`[StubStorage] replaceFile: ${params.oldKey} → ${params.newKey}`)
    await this.deleteFile({ key: params.oldKey })
    return this.initializeUpload({
      key: params.newKey,
      contentType: params.contentType,
      fileSizeBytes: params.fileSizeBytes,
    })
  }
}
