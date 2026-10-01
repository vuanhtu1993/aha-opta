/**
 * @file speaking-quiz.ts
 * @description Định nghĩa Type & Interface cho chế độ Speaking Quiz (Speak Your Mind - PREP)
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

export interface ITargetKeyword {
  word: string;
  ipa?: string;
  meaning: string;
}

export interface ISpeakingScaffoldStage {
  stage: "point" | "reason" | "example" | "conclusion";
  title: string;
  signposts: string[];
  hint: string;
  modelAnswer: string;
}

export interface ISpeakingScaffold {
  point: ISpeakingScaffoldStage;
  reason: ISpeakingScaffoldStage;
  example: ISpeakingScaffoldStage;
  conclusion: ISpeakingScaffoldStage;
}

export interface ISpeakingQuestion {
  id: string;
  topic: string;
  question: string;
  level: "B1" | "B2" | "C1";
  targetKeywords: ITargetKeyword[];
  prepScaffold: ISpeakingScaffold;
}
