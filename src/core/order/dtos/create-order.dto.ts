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
import { CreateAddressDto } from 'src/core/user/dtos/create-address.dto';
import { Type } from 'class-transformer';
import {
  ORDER_PAYMENT_METHOD,
  ORDER_PAYMENT_METHOD_VALUES,
} from '../enums/order-payment-method.enum';

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
    description: 'Payment method for the order',
    example: ORDER_PAYMENT_METHOD.CASH,
    enum: ORDER_PAYMENT_METHOD_VALUES,
  })
  @IsEnum(ORDER_PAYMENT_METHOD)
  @IsNotEmpty()
  paymentWay: ORDER_PAYMENT_METHOD;

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
