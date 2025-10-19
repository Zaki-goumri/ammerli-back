import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import {
  PAYEMENT_WAY,
  PAYMENT_WAY_VALUES,
  PaymentWay,
} from '../enums/payement-way.enum';
import { CreateAddressDto } from 'src/core/user/dtos/create-address.dto';

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

  @ApiProperty({
    description: 'address for delivery',
  })
  @IsNotEmpty()
  address: CreateAddressDto | number;
}

