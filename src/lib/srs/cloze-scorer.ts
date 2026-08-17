/**
 * Calculates Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Checks if user answer matches target answer within max edit distance (default <= 2).
 * Normalizes case and trims whitespace.
 */
export function isClozeCorrect(
  userInput: string,
  answer: string,
  maxDistance: number = 2
): boolean {
  const normInput = userInput.trim().toLowerCase();
  const normAnswer = answer.trim().toLowerCase();

  if (!normInput || !normAnswer) return false;
  if (normInput === normAnswer) return true;

  return getLevenshteinDistance(normInput, normAnswer) <= maxDistance;
}
