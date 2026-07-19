/**
 * Escapes special characters for safe RegExp usage.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generates the next sequential ID(s) based on a dynamic prefix.
 * If `n` is omitted, it returns an array with a single ID (default behaviour).
 *
 * @param items - Array of objects with an `id` property.
 * @param prefix - The prefix to match (e.g., "Section", "Chapter").
 * @param n - Number of sequential IDs to generate (default: 1).
 * @returns An array of strings: e.g., ["Section 3"] or ["Section 3", "Section 4"].
 */
export function generateNextId<T extends { id: string }>(items: T[], prefix: string, n: number = 1): string[] {
  if (n <= 0) return [];

  let maxNumber = 0;
  const escapedPrefix = escapeRegExp(prefix);
  const regex = new RegExp(`^${escapedPrefix} (\\d+)$`);

  for (const item of items) {
    const match = item.id.match(regex);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      if (currentNumber > maxNumber) maxNumber = currentNumber;
    }
  }

  // Generate n IDs starting from maxNumber + 1
  return Array.from({ length: n }, (_, i) => `${prefix} ${maxNumber + i + 1}`);
}
