import { ApiProperty } from '@nestjs/swagger';

export class BuyerInfoDto {
  @ApiProperty({ description: "The name of the supermarket" })
  supermarketName: string;

  @ApiProperty({ description: "The name of the client" })
  clientName: string;

  @ApiProperty({ description: "The phone number of the client" })
  phoneNumber: string;

  @ApiProperty({ description: "The full address of the order" })
  address: string;
}