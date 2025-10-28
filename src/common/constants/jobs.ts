export const SEARACH_JOB_NAME = {
  SEARCH: 'search',
  SEARCH_INDEX: 'search_index',
  SEARCH_DELETE: 'search_delete',
  SEARCH_UPDATE: 'search_update',
  SEARCH_REINDEX: 'search_reindex',
  SEARCH_REBUILD: 'search_rebuild',
  SEARCH_SYNC: 'search_sync',
  SEARCH_SYNC_ALL: 'search_sync_all',
  SEARCH_SYNC_INDEX: 'search_sync_index',
  SEARCH_SYNC_DELETE: 'search_sync_delete',
  SEARCH_SYNC_UPDATE: 'search_sync_update',
} as const;
export const NOTIFICATION_JOBS = {
  SEND_NOTIFICATION: 'send-notification',
  SEND_BULK_NOTIFICATION: 'send-bulk-notification',
};

export const UPLOAD_JOBS = {
  UPLOAD_FILE: 'upload-file',
  DELETE_FILE: 'delete-file',
  UPLOAD_MULTIPLE_FILES: 'upload-multiple-files',
};
