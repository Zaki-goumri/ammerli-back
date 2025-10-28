/**
 * @fileoverview Defines the OsType for tokens.
 * @module core/authentication/enums/os-type
 */

/**
 * @description Enum for operating system types.
 * @enum {string}
 */
export const OsType = {
  /**
   * Android operating system.
   * @type {string}
   */
  ANDROID: 'android',
  /**
   * iOS operating system.
   * @type {string}
   */
  IOS: 'ios',
  /**
   * Web browser.
   * @type {string}
   */
  WEB: 'web',
} as const;

/**
 * @description Type for operating system values.
 * @type {string}
 */
export type OsType = (typeof OsType)[keyof typeof OsType];
