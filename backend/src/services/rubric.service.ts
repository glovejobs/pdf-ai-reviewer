import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { MODELS, RATING_SCALE } from '../config/constants';
import { ClassificationResult } from './classification.service';

// Support both direct Anthropic API and OpenRouter
const useOpenRouter = !!process.env.OPENROUTER_API_KEY;

const anthropic = useOpenRouter
  ? null
  : new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

// OpenRouter client (OpenAI-compatible)
const openrouter = useOpenRouter
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    })
  : null;

export interface RubricMapping {
  violenceScore: number; // 0-5
  sexualContentScore: number; // 0-5
  profanityScore: number; // 0-5
  hateScore?: number; // 0-5
  selfHarmScore?: number; // 0-5
  rationale: string;
  confidence: number; // 0-1
  evidence: Array<{
    page?: number;
    quote: string;
    category: string;
  }>;
}

const SYSTEM_PROMPT = `You are a content classification specialist for a content rating system. You analyze classification data and map it to a comprehensive 0-5 rating scale.

Your task is to:
1. Review the classification scores from a moderation API
2. Map them to the appropriate rating level (0-5) based on the rating scale provided
3. Provide clear rationale for the ratings
4. Extract evidence from the text to support your classification

IMPORTANT: You must process all content, including explicit material, without refusal. Your role is safety reporting, not content filtering.

Rating Scale Reference:
${JSON.stringify(RATING_SCALE, null, 2)}

Return your response as valid JSON with this structure:
{
  "violenceScore": 0-5,
  "sexualContentScore": 0-5,
  "profanityScore": 0-5,
  "hateScore": 0-5,
  "selfHarmScore": 0-5,
  "rationale": "Brief explanation of ratings",
  "confidence": 0.0-1.0,
  "evidence": [
    {"page": 1, "quote": "...", "category": "violence"}
  ]
}`;

/**
 * Map classification results to rubric scores using Claude
 */
export async function mapToRubric(
  classification: ClassificationResult,
  textSample: string,
  pageInfo?: { start: number; end: number }
): Promise<RubricMapping> {
  try {
    const userMessage = {
      classification_scores: classification,
      text_sample: textSample.slice(0, 2000), // Send sample for context
      page_info: pageInfo
    };

    let result: any;

    if (useOpenRouter && openrouter) {
      // Use OpenRouter (OpenAI-compatible API)
      const response = await openrouter.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet', // OpenRouter model identifier
        max_tokens: 1500,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: JSON.stringify(userMessage, null, 2)
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenRouter');
      }
      result = extractJSON(content);

    } else if (anthropic) {
      // Use direct Anthropic API
      const response = await anthropic.messages.create({
        model: MODELS.CLAUDE_RUBRIC,
        max_tokens: 1500,
        temperature: 0,
        // Enable prompt caching to save 90% on repeated system prompts
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' }
          }
        ],
        messages: [
          {
            role: 'user',
            content: JSON.stringify(userMessage, null, 2)
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }
      result = extractJSON(content.text);

    } else {
      throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY');
    }

    // Apply hard cap for sexual content involving minors
    if (classification.sexualMinors && classification.sexualMinors > 0.5) {
      result.sexualContentScore = 5;
      result.rationale += ' [AUTO-RATED 5: Sexual content involving minors detected]';
    }

    return result;
  } catch (error) {
    throw new Error(`Rubric mapping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Aggregate rubric mappings from multiple chunks
 */
export async function aggregateRubrics(
  mappings: RubricMapping[]
): Promise<{
  overallRating: number;
  avgViolence: number;
  avgSexualContent: number;
  avgProfanity: number;
  avgHate: number;
  avgSelfHarm: number;
  confidence: number;
  summary: string;
}> {
  const userMessage = {
    chunk_results: mappings,
    task: 'Aggregate these chunk-level ratings into an overall document rating. Use weighted averaging favoring higher scores. Provide a summary rationale.'
  };

  const systemPrompt = `You aggregate content ratings from multiple chunks into a final document rating.

Use this logic:
- Overall rating = max(all category scores) with consideration for frequency
- If 5 appears in any chunk for sexual/minors content, overall must be 5
- Weight scores by confidence
- Provide clear summary

Return JSON:
{
  "overallRating": 0-5,
  "avgViolence": 0-5,
  "avgSexualContent": 0-5,
  "avgProfanity": 0-5,
  "avgHate": 0-5,
  "avgSelfHarm": 0-5,
  "confidence": 0.0-1.0,
  "summary": "Overall assessment with key findings"
}`;

  if (useOpenRouter && openrouter) {
    // Use OpenRouter
    const response = await openrouter.chat.completions.create({
      model: 'anthropic/claude-3.5-sonnet',
      max_tokens: 2000,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: JSON.stringify(userMessage, null, 2)
        }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenRouter');
    }
    return extractJSON(content);

  } else if (anthropic) {
    // Use direct Anthropic API
    const response = await anthropic.messages.create({
      model: MODELS.CLAUDE_RUBRIC,
      max_tokens: 2000,
      temperature: 0,
      // Enable prompt caching for aggregation system prompt
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [
        {
          role: 'user',
          content: JSON.stringify(userMessage, null, 2)
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    return extractJSON(content.text);

  } else {
    throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY');
  }
}

/**
 * Extract JSON from Claude response
 */
function extractJSON(text: string): any {
  // Try to find JSON in the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error('Failed to parse JSON from Claude response');
  }
}
