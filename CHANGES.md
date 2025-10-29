# Changes Made to the Application

This document outlines the modifications implemented to enhance file management, introduce soft deletion for key entities, and improve background processing.

## 1. Soft Deletion for Categories and Products

To prevent data integrity issues with dependent records (e.g., orders), `Category` and `Product` entities now utilize soft deletion. This means that when a record is "deleted," it is merely marked as inactive in the database rather than being permanently removed.

-   **`src/core/product/entities/category.entity.ts`**:
    -   Added `@DeleteDateColumn()` to the `Category` entity to enable soft deletion.

-   **`src/core/product/services/category.service.ts`**:
    -   The `remove(id: number)` method now performs a `softDelete` on the category.
    -   If the category has a `pictureUrl`, a `DELETE_FILES_BULK` job is added to the upload queue to asynchronously delete the associated file from object storage.

-   **`src/core/product/services/product.service.ts`**:
    -   The `remove(id: number, userId: number)` method now performs a `softDelete` on the product.
    -   All associated product picture URLs are collected, and a `DELETE_FILES_BULK` job is added to the upload queue to asynchronously delete these files from object storage.

-   **`src/core/user/user.service.ts`**:
    -   The `deleteUser(id: number)` method now performs a `softDelete` on the user.
    -   If the user has a `profilePic`, a `DELETE_FILES_BULK` job is added to the upload queue to asynchronously delete the associated file from object storage.
    -   The `updateUserProfilePic` method now dispatches a `DELETE_FILES_BULK` job for the old profile picture if it exists, ensuring old images are cleaned up.

## 2. Background File Operations (Bulk Delete and Upload)

File deletion and bulk uploads are now handled asynchronously via a BullMQ queue to offload heavy operations from the main application thread and improve responsiveness.

-   **`src/common/constants/jobs.ts`**:
    -   Added new job names: `DELETE_FILES_BULK` and `UPLOAD_FILES_BULK` for handling multiple file operations.

-   **`src/infrastructure/object-storage/object-storage.service.ts`**:
    -   Added `deleteBulkFiles(objectUrls: string[])` method to efficiently delete multiple files from MinIO storage.
    -   Modified `uploadFile` and `uploadBulkFiles` methods to accept a more generic file-like object structure, allowing them to be easily serialized and deserialized for queue processing.

-   **`src/infrastructure/queue/upload/dto/delete-files-bulk.dto.ts`**:
    -   New DTO created to define the structure for bulk file deletion jobs.

-   **`src/infrastructure/queue/upload/dto/upload-files-bulk.dto.ts`**:
    -   New DTO created to define the structure for bulk file upload jobs.

-   **`src/infrastructure/queue/upload/upload.processor.ts`**:
    -   Updated the `process` method to handle `DELETE_FILES_BULK` and `UPLOAD_FILES_BULK` jobs.
    -   Implemented `handleBulkUploading` to process multiple file uploads.
    -   Modified `onCompleted` and `onFailed` event handlers to correctly dispatch events for both single and bulk file operations.

## 3. New Endpoint for Product Image Management

-   **`src/core/product/dtos/product/delete-product-pictures.dto.ts`**:
    -   New DTO created to define the payload for deleting specific product pictures.

-   **`src/core/product/product.controller.ts`**:
    -   Added a new `DELETE` endpoint at `/products/:productId/pictures`.
    -   This endpoint allows authenticated users (ADMIN, WHOLESELLER) to soft delete specific images associated with a product by providing an array of `pictureIds` in the request body.
    -   It calls the new `productService.deleteProductImages` method.

-   **`src/core/product/services/product.service.ts`**:
    -   Injected `ProductPicture` repository.
    -   Added `deleteProductImages(productId: number, pictureIds: number[])` method.
    -   This method finds the specified product pictures, queues their URLs for bulk deletion from object storage, and then soft deletes the `ProductPicture` records from the database.

## 4. Cron Job for Notification Cleanup

-   **`src/core/notifications/notifications.module.ts`**:
    -   Imported `ScheduleModule.forRoot()` to enable cron job functionality.

-   **`src/core/notifications/notifications.service.ts`**:
    -   Added a `@Cron(CronExpression.EVERY_WEEK)` job (`handleCron`) that runs weekly.
    -   This job soft deletes notifications older than one week from the database.
