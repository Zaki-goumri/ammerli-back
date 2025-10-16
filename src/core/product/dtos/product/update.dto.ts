import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
