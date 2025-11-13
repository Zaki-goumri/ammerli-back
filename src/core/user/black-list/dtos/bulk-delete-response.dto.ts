import { ApiProperty } from '@nestjs/swagger';

/**
 * @class BulkDeleteResponseDto
 * @description Response DTO for bulk delete operation
 */
export class BulkDeleteResponseDto {
  @ApiProperty({
    description: 'Number of users successfully soft-deleted',
    example: 3,
  })
  deletedCount: number;
}
