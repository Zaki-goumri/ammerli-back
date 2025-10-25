import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PAYEMENT_WAY,
  PAYMENT_WAY_VALUES,
  PaymentWay,
} from '../enums/payement-way.enum';
import { CreateAddressDto } from 'src/core/user/dtos/create-address.dto';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({
    description: 'ID of the product',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  productId: number;
  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'List of order items',
    example: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
  })
  @IsArray()
  items: OrderItemDto[];

  @ApiProperty({
    description: 'payement way ID',
    example: PAYEMENT_WAY.CIB,
    enum: PAYMENT_WAY_VALUES,
  })
  @IsEnum(PAYMENT_WAY_VALUES)
  @IsNotEmpty()
  payementWay: PaymentWay;

  @ApiPropertyOptional({
    description: 'ID of the address to use for delivery',
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  @ValidateIf((o) => !o.address)
  addressId?: number;

  @ApiPropertyOptional({
    description: 'A new address to create for delivery',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  @ValidateIf((o) => !o.addressId)
  address?: CreateAddressDto;
}
