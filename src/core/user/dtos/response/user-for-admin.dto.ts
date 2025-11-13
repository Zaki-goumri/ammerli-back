import { ApiProperty } from '@nestjs/swagger';
import { USER_ROLES, UserRole } from 'src/common/enums/user-role.enum';

export class UserForAdminDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: number;

  @ApiProperty({ description: 'The name of the user' })
  name: string;

  @ApiProperty({ description: 'The phone number of the user' })
  phoneNumber: string;

  @ApiProperty({ description: 'The role of the user', enum: USER_ROLES })
  role: UserRole;

  @ApiProperty({ 
    description: 'Whether the user is blacklisted',
    example: false,
  })
  isBlacklisted: boolean;
}
