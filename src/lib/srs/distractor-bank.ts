/**
 * Default English Definition Bank (CEFR B1 - C1)
 * Used as fallback distractors when a user's personal vocabulary bank has fewer than 3 alternative words.
 */
export const DEFAULT_DISTRACTORS: string[] = [
  "A period of little or no growth after rapid progress or change",
  "An important discovery or event that helps improve a situation or provide an answer",
  "The act of thinking deeply about something or remembering past experiences",
  "A practical method or technique used to solve a specific problem",
  "To gradually become smaller, weaker, or less important over time",
  "The ability to understand something instinctively without needing conscious reasoning",
  "A standard or benchmark by which other things can be judged or measured",
  "To make something clear or easier to understand by providing more details",
  "A sudden and significant change in the way something is done or understood",
  "The capacity to recover quickly from difficulties, tough situations, or toughness",
  "To cause something to begin or happen, especially a reaction or process",
  "A subtle difference in meaning, expression, sound, or appearance",
  "To combine different ideas, styles, or systems into a single effective whole",
  "The state of being widely known or respected for excellence or achievements",
  "To delay or postpone doing something that should be done immediately",
  "A set of principles or beliefs that guide how a person or group behaves",
  "To give official permission, approval, or formal authorization for an action",
  "A temporary failure or gap in memory, concentration, or judgment",
  "To make a continuous effort to achieve a difficult goal despite challenges",
  "The process of making something as effective, perfect, or functional as possible",
  "An obstacle or difficulty that prevents smooth progress or success",
  "To emphasize or make something stand out clearly from its surroundings",
  "The quality of being logical, consistent, and easy to follow or comprehend",
  "To reduce or lessen the severity, intensity, or painfulness of something",
  "A tendency or inclination towards a particular opinion, preference, or outcome",
  "To express feelings, thoughts, or ideas clearly and effectively in words",
  "A fundamental change in approach, mindset, or underlying assumptions",
  "To hold someone's attention completely because of being interesting or exciting",
  "The act of examining one's own thoughts, feelings, and motivations carefully",
  "To succeed in dealing with or gaining control over a challenge or obstacle"
];

/**
 * Returns `count` random distractors from the default bank that do not equal the target explanation.
 */
export function getRandomDefaultDistractors(targetExplanation: string, count: number = 3): string[] {
  const filtered = DEFAULT_DISTRACTORS.filter(
    (d) => d.toLowerCase().trim() !== targetExplanation.toLowerCase().trim()
  );
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
