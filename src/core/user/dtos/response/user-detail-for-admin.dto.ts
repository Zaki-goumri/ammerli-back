import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { USER_ROLES, UserRole } from 'src/common/enums/user-role.enum';
import { AddressDto } from './address.dto';

export class UserDetailForAdminDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  supermarketName?: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional({ type: () => AddressDto, nullable: true })
  lastAddress: AddressDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: USER_ROLES })
  role: UserRole;

  @ApiProperty({ type: () => Boolean })
  isActive: boolean;
}
