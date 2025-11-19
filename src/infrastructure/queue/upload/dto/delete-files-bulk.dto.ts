export class DeleteFilesBulkDto {
  files: { objectName: string; bucketName: string }[];
  metadata?: { targetId: string; targetType: string };
}
