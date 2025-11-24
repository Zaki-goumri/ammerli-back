import { ApiProperty } from '@nestjs/swagger';

export class SendInvoiceDto {
  @ApiProperty({
    description: 'The ID of the invoice to be sent',
    example: 123,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'The creation date of the invoice',
    example: '2024-01-01T12:00:00Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The URL of the PDF invoice',
    type: String,
  })
  pdfUrl: string;
}
