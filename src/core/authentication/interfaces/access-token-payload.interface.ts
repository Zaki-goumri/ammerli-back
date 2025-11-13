import { UserRole } from 'src/common/enums/user-role.enum';

export interface AccessTokenPayload {
  id: number;
  phoneNumber: string;
  role: UserRole;
  isRegistered: boolean;
}

export interface RegistrationTokenPayload {
  phoneNumber: string;
  purpose: 'registration';
}

export type JwtPayload = AccessTokenPayload | RegistrationTokenPayload;
