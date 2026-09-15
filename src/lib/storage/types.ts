// src/lib/storage/types.ts
// Storage provider interface designed for future direct browser-to-object-storage uploads.
// The dashboard server handles auth, metadata, and upload initialization only.
// Actual file bytes travel directly from browser to storage (e.g. R2 presigned URLs).

export interface UploadInitResult {
  /** Provider-specific upload ID (e.g. R2 multipart upload ID) */
  uploadId: string
  /** Presigned URL(s) for direct browser upload. Null while storage is not connected. */
  uploadUrl: string | null
  /** Additional provider-specific config (e.g. part size, headers) */
  config?: Record<string, unknown>
}

export interface UploadCompleteResult {
  /** Final storage key / path */
  storageKey: string
  /** Provider name (e.g. 'cloudflare-r2') */
  provider: string
}

export interface DownloadUrlResult {
  /** Temporary presigned download URL */
  url: string
  /** URL expiry time */
  expiresAt: Date
}

/**
 * Storage provider abstraction.
 * Implementations handle the specifics of each storage backend.
 * The dashboard server NEVER proxies large file bytes.
 *
 * Flow:
 * 1. Client calls initializeUpload() via API → gets presigned URL
 * 2. Client uploads directly to storage using presigned URL
 * 3. Client calls completeUpload() via API → server verifies & records
 */
export interface StorageProvider {
  readonly name: string

  /**
   * Initialize an upload — returns presigned URL for direct browser upload.
   * For multipart uploads, this creates the multipart upload and returns
   * the first part's presigned URL along with upload configuration.
   */
  initializeUpload(params: {
    key: string
    contentType: string
    fileSizeBytes?: number
  }): Promise<UploadInitResult>

  /**
   * Complete/finalize an upload after the browser has uploaded all parts.
   * Verifies the upload and returns the final storage reference.
   */
  completeUpload(params: {
    uploadId: string
    key: string
  }): Promise<UploadCompleteResult>

  /**
   * Generate a temporary download URL for an existing file.
   */
  getDownloadUrl(params: {
    key: string
    expiresInSeconds?: number
  }): Promise<DownloadUrlResult>

  /**
   * Delete a file from storage.
   */
  deleteFile(params: {
    key: string
  }): Promise<void>

  /**
   * Replace a file — deletes old key, initializes upload for new key.
   * Returns upload initialization for the replacement file.
   */
  replaceFile(params: {
    oldKey: string
    newKey: string
    contentType: string
    fileSizeBytes?: number
  }): Promise<UploadInitResult>
}
