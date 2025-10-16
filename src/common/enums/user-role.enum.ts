export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SUPERMARKET: 'SUPERMARKET',
  WHOLESELLER: 'WHOLESELLER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_VALUES = Object.values(USER_ROLES) as UserRole[];
