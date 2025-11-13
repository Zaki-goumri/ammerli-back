import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

/**
 * @class BulkDeleteBlacklistedUsersDto
 * @description DTO for bulk deleting blacklisted users
 */
export class BulkDeleteBlacklistedUsersDto {
  @ApiProperty({
    description: 'Array of user IDs to soft-delete',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one user ID is required' })
  @IsInt({ each: true, message: 'Each user ID must be an integer' })
  userIds: number[];
}
