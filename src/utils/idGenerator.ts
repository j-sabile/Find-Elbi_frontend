/**
 * Escapes special characters in a string so it can be safely used in a RegExp.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generates the next sequential ID based on a dynamic prefix.
 * @param items Array of objects containing an 'id' string property.
 * @param prefix The string prefix to look for (e.g., "Section", "Chapter").
 * @returns A string with the next available ID (e.g., "Section 3").
 */
export function generateNextId<T extends { id: string }>(items: T[], prefix: string): string {
  let maxNumber = 0;

  // Dynamically build the regex.
  const escapedPrefix = escapeRegExp(prefix);
  const regex = new RegExp(`^${escapedPrefix} (\\d+)$`);

  for (const item of items) {
    const match = item.id.match(regex);
    if (match) {
      const currentNumber = parseInt(match[1], 10);
      if (currentNumber > maxNumber) maxNumber = currentNumber;
    }
  }

  return `${prefix} ${maxNumber + 1}`;
}
