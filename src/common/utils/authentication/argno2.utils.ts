import * as argon2 from 'argon2';
/**
 * Generates an Argon2 hash for the given input string.
 * @param input The plain text string to hash (e.g., a password).
 * @returns A promise that resolves with the Argon2 hash string.
 */
export function generateHash(input: string): Promise<string> {
  // We use the default settings for Argon2, which are generally safe.
  // The options can be configured for memory, time, and parallelism (recommended).
  return argon2.hash(input);
}

/**
 * Compares a plain text string against an Argon2 hash.
 * @param input The plain text string to compare (e.g., a password provided at login).
 * @param hash The Argon2 hash stored in the database.
 * @returns A promise that resolves to true if the input matches the hash, false otherwise.
 */
export function compareHash(input: string, hash: string): Promise<boolean> {
  // Argon2's compare function automatically extracts the necessary parameters
  // (salt, time cost, memory cost, etc.) from the hash string.
  return argon2.verify(input, hash);
}
