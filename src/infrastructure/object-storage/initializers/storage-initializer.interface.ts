export const STORAGE_INITIALIZER = 'STORAGE_INITIALIZER';

export interface StorageInitializer {
  initialize(): Promise<void>;
}
