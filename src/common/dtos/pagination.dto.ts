import { Type as ClassType } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/*
 * DTO for handling pagination query parameters.
 * Includes validation and transformation for 'lastId' and 'take' parameters.
 */
export class PaginationQueryDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;
}

/*
 * Base DTO for pagination metadata in responses.
 * Contains information about the current page, limit, and whether it's the last page.
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage!: boolean;
}

export class PaginationResponseDto<T> {
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto })
  @Type(() => PaginationMetaDto)
  meta!: PaginationMetaDto;
}

/*
 * Factory function to create typed pagination response for Swagger
 */
export function PaginatedResponse<T>(classRef: ClassType<T>) {
  abstract class PaginatedResponseClass {
    @ApiProperty({ type: [classRef] })
    data!: T[];

    @ApiProperty({ type: PaginationMetaDto })
    meta!: PaginationMetaDto;
  }

  return PaginatedResponseClass;
}
