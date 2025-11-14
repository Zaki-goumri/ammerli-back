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

export const isAccessTokenPayload = (
  payload: JwtPayload,
): payload is AccessTokenPayload => {
  return (payload as AccessTokenPayload).id !== undefined;
};

export const isRegistrationTokenPayload = (
  payload: JwtPayload,
): payload is RegistrationTokenPayload => {
  return (payload as RegistrationTokenPayload).purpose === 'registration';
};
