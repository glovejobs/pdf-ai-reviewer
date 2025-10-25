import pdf from 'pdf-parse';
import { CHUNKING_CONFIG } from '../config/constants';

export interface ExtractedChunk {
  index: number;
  text: string;
  pageStart: number;
  pageEnd: number;
  tokenCount: number;
}

export interface ExtractionResult {
  text: string;
  pageCount: number;
  chunks: ExtractedChunk[];
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text,
      pageCount: data.numpages
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Split text into overlapping chunks for processing
 */
export function chunkText(text: string, maxTokens = CHUNKING_CONFIG.MAX_TOKENS): ExtractedChunk[] {
  const { OVERLAP_TOKENS, CHARS_PER_TOKEN } = CHUNKING_CONFIG;

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;
  const chunks: ExtractedChunk[] = [];

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxChars, text.length);
    const chunkText = text.slice(startIndex, endIndex);

    chunks.push({
      index: chunkIndex,
      text: chunkText,
      pageStart: estimatePageNumber(startIndex, text),
      pageEnd: estimatePageNumber(endIndex, text),
      tokenCount: Math.ceil(chunkText.length / CHARS_PER_TOKEN)
    });

    chunkIndex++;
    startIndex = endIndex - overlapChars;

    // Prevent infinite loop
    if (startIndex >= text.length - overlapChars) break;
  }

  return chunks;
}

/**
 * Estimate page number from character position
 * Assumes average of 3000 characters per page
 */
function estimatePageNumber(charPosition: number, fullText: string): number {
  const CHARS_PER_PAGE = 3000;
  return Math.max(1, Math.ceil(charPosition / CHARS_PER_PAGE));
}

/**
 * Main extraction and chunking pipeline
 */
export async function extractAndChunk(buffer: Buffer): Promise<ExtractionResult> {
  const { text, pageCount } = await extractTextFromPDF(buffer);
  const chunks = chunkText(text);

  return {
    text,
    pageCount,
    chunks
  };
}
