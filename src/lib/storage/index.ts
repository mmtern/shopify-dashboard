// src/lib/storage/index.ts
// Factory for the active storage provider.
// When connecting Cloudflare R2, change only this file.

import type { StorageProvider } from './types'
import { StubStorageProvider } from './stub-provider'

let instance: StorageProvider | null = null

/**
 * Returns the active storage provider singleton.
 * Currently returns the stub provider (no real storage).
 * When R2 is connected, swap to the R2 provider here.
 */
export function getStorageProvider(): StorageProvider {
  if (!instance) {
    instance = new StubStorageProvider()
  }
  return instance
}

export type { StorageProvider } from './types'
export type { UploadInitResult, UploadCompleteResult, DownloadUrlResult } from './types'
