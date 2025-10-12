export const PostgresErrorCode = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  EXCLUSION_VIOLATION: '23P01',
  NUMERIC_VALUE_OUT_OF_RANGE: '22003',
  DIVISION_BY_ZERO: '22012',
  SYNTAX_ERROR: '42601',
  UNDEFINED_TABLE: '42P01',
} as const;

export type PostgresErrorCode =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];

export function isPostgresError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}
