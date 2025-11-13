import { ApiProperty, PartialType } from '@nestjs/swagger';
import { AuthResDto } from './refresh-token.dto';
import { UserDto } from 'src/core/user/dtos/response/user.dto';

export class ValidateOtpDto extends PartialType(AuthResDto) {
  @ApiProperty({
    example: true,
    description: 'Indicates if the user is registered.',
  })
  isRegistered: boolean;

  @ApiProperty({
    type: () => UserDto,
    nullable: true,
    description: 'User information, null if not registered.',
  })
  user?: UserDto | null;

  @ApiProperty({
    example: 'string',
    description: 'Refresh token, null if not registered.',
    nullable: true,
  })
  refreshToken?: string | null;
}
