import OpenAI from 'openai';
import { MODELS } from '../config/constants';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ClassificationResult {
  sexual: number;
  violence: number;
  hate: number;
  selfHarm: number;
  sexualMinors?: number;
  violenceGraphic?: number;
  rawResponse: any;
}

/**
 * Classify content using OpenAI's moderation API
 * Uses omni-moderation-latest which handles explicit content without refusal
 */
export async function classifyContent(text: string): Promise<ClassificationResult> {
  try {
    const response = await openai.moderations.create({
      model: MODELS.OPENAI_MODERATION,
      input: text
    });

    const result = response.results[0];
    const scores = result.category_scores;

    return {
      sexual: scores.sexual || 0,
      violence: scores.violence || 0,
      hate: scores.hate || 0,
      selfHarm: scores['self-harm'] || 0,
      sexualMinors: scores['sexual/minors'] || 0,
      violenceGraphic: scores['violence/graphic'] || 0,
      rawResponse: result
    };
  } catch (error) {
    throw new Error(`Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch classify multiple chunks
 * Note: OpenAI moderation API processes one at a time, but we can parallelize
 */
export async function classifyBatch(texts: string[]): Promise<ClassificationResult[]> {
  const BATCH_SIZE = 5; // Process 5 at a time to avoid rate limits
  const results: ClassificationResult[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(text => classifyContent(text))
    );
    results.push(...batchResults);

    // Small delay to respect rate limits
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Convert classification scores to 0-5 scale
 */
export function scoreToRating(score: number): number {
  if (score < 0.1) return 0;
  if (score < 0.3) return 1;
  if (score < 0.5) return 2;
  if (score < 0.7) return 3;
  if (score < 0.9) return 4;
  return 5;
}
