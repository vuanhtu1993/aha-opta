/**
 * @file speaking-quiz.service.ts
 * @description Service providing PREP speaking questions for practice and experimentation.
 *
 * Mapped Spec: FR-VOCAB-06 | US-VOCAB-03
 * Made by Anh Tu - Share to be share
 */

import { ISpeakingQuestion } from "@/lib/types/speaking-quiz";
import { fetchSpeakingQuestionById } from "@/lib/services/speaking-quiz-client";

export const MOCK_SPEAKING_QUESTIONS: ISpeakingQuestion[] = [
  {
    id: "sq-01",
    topic: "Technology & Education",
    question: "Should AI be allowed to replace human teachers?",
    level: "B2",
    targetKeywords: [
      { word: "empathy", ipa: "/ˈem.pə.θi/", meaning: "The ability to understand and share the feelings of others" },
      { word: "irreplaceable", ipa: "/ˌɪr.ɪˈpleɪ.sə.bəl/", meaning: "Impossible to replace if lost or damaged" }
    ],
    prepScaffold: {
      point: {
        stage: "point",
        title: "Point",
        signposts: ["In my opinion, ...", "I strongly believe that ...", "From my perspective, ..."],
        hint: "State clearly whether you agree or disagree.",
        modelAnswer: "In my opinion, AI can assist learning effectively but should never fully replace human teachers."
      },
      reason: {
        stage: "reason",
        title: "Reason",
        signposts: ["The main reason is that ...", "Because ...", "Since ..."],
        hint: "Explain why emotional connection and empathy matter in education.",
        modelAnswer: "The primary reason is that genuine education requires deep empathy and emotional bonding, which algorithms completely lack."
      },
      example: {
        stage: "example",
        title: "Example",
        signposts: ["For instance, ...", "In my personal experience, ...", "Take ... as an example"],
        hint: "Mention how a dedicated teacher supports a student through hardship.",
        modelAnswer: "For instance, when students struggle with self-doubt or personal adversity, a caring teacher provides inspiration that no automated chatbot can offer."
      },
      conclusion: {
        stage: "conclusion",
        title: "Point",
        signposts: ["Therefore, ...", "That is why ...", "To sum up, ..."],
        hint: "Reinforce AI as a helpful tool rather than a replacement.",
        modelAnswer: "Therefore, while AI is an extraordinary instructional assistant, the human essence of teaching remains truly irreplaceable."
      }
    }
  },
  {
    id: "sq-02",
    topic: "Habits & Personal Growth",
    question: "Is daily consistency more important than intense motivation when building new habits?",
    level: "B1",
    targetKeywords: [
      { word: "consistency", ipa: "/kənˈsɪs.tən.si/", meaning: "The quality of always behaving or performing in a similar way" },
      { word: "compound", ipa: "/ˈkɒm.paʊnd/", meaning: "To increase or build up exponentially over time" }
    ],
    prepScaffold: {
      point: {
        stage: "point",
        title: "Point",
        signposts: ["I firmly believe that ...", "In my view, ...", "Without a doubt, ..."],
        hint: "Assert that steady daily discipline outweighs temporary inspiration.",
        modelAnswer: "I firmly believe that daily consistency is vastly more important than intense motivation for lasting success."
      },
      reason: {
        stage: "reason",
        title: "Reason",
        signposts: ["This is because ...", "The reason is that ...", "Due to the fact that ..."],
        hint: "Explain how motivation fades while habits build automatic routines.",
        modelAnswer: "This is because emotional motivation fluctuates quickly, whereas small repetitive actions build automatic neural pathways."
      },
      example: {
        stage: "example",
        title: "Example",
        signposts: ["For example, ...", "Take language learning as an example, ...", "In my case, ..."],
        hint: "Compare 15 minutes of daily practice with cramming 5 hours once a week.",
        modelAnswer: "For example, practicing English for just fifteen minutes every single day produces dramatic compound growth compared to cramming five hours on weekends."
      },
      conclusion: {
        stage: "conclusion",
        title: "Point",
        signposts: ["Therefore, ...", "As a result, ...", "That is why ..."],
        hint: "Conclude that consistency is the foundation of habit mastery.",
        modelAnswer: "Therefore, focusing on disciplined consistency rather than waiting for mood motivation is the true secret of mastery."
      }
    }
  }
];

export async function getSpeakingQuestions(): Promise<ISpeakingQuestion[]> {
  return MOCK_SPEAKING_QUESTIONS;
}

export async function getSpeakingQuestionById(id?: string): Promise<ISpeakingQuestion> {
  if (id) {
    const found = MOCK_SPEAKING_QUESTIONS.find((q) => q.id === id);
    if (found) return found;

    try {
      const agentQuestion = await fetchSpeakingQuestionById(id);
      if (agentQuestion) return agentQuestion;
    } catch {
      // Fallback về câu hỏi mẫu mặc định nếu không kết nối được agent service
    }
  }
  return MOCK_SPEAKING_QUESTIONS[0];
}
