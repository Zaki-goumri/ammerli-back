/**
 * Parse various formats of query parameters into a proper array of numbers
 * Handles array notation, comma-separated values, and single values
 * @param value The query parameter value to transform
 * @returns Array of numbers or undefined if empty
 */
export function parseIntArrayQueryParam(
  value: string | undefined,
): number[] | undefined {
  console.log('Parsing value:', value);
  if (value === undefined || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map((v) => Number(v));
  }
  return value.split(',').map((v) => Number(v.trim()));
}
