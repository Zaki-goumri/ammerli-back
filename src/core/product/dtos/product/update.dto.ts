import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create.dto';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['sellerId'] as const),
) {}
