export interface TermMatch {
  term: string;
  category: string;
  count: number;
  positions: Array<{
    page?: number;
    context: string;
  }>;
}

export interface TermCountResult {
  totalCount: number;
  byCategory: Record<string, number>;
  matches: TermMatch[];
}

// Default term lists - can be loaded from database
const DEFAULT_TERM_LISTS = {
  profanity: [
    'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'bastard', 'crap',
    'piss', 'dick', 'cock', 'pussy', 'slut', 'whore'
  ],
  violence: [
    'kill', 'murder', 'blood', 'gore', 'torture', 'stab', 'shoot',
    'weapon', 'gun', 'knife', 'death', 'corpse', 'mutilate'
  ],
  sexual: [
    'sex', 'sexual', 'nude', 'naked', 'breast', 'penis', 'vagina',
    'rape', 'molest', 'intercourse', 'erotic', 'orgasm'
  ],
  hate: [
    'racist', 'sexist', 'slur', 'discrimination', 'bigot', 'hatred'
  ],
  drugs: [
    'drug', 'cocaine', 'heroin', 'marijuana', 'meth', 'addiction'
  ]
};

/**
 * Count flagged terms in text
 */
export function countTerms(
  text: string,
  termLists: Record<string, string[]> = DEFAULT_TERM_LISTS,
  pageEstimate?: number
): TermCountResult {
  const matches: TermMatch[] = [];
  const byCategory: Record<string, number> = {};
  let totalCount = 0;

  for (const [category, terms] of Object.entries(termLists)) {
    byCategory[category] = 0;

    for (const term of terms) {
      const regex = new RegExp(`\\b${escapeRegex(term)}\\w*\\b`, 'gi');
      const termMatches = [...text.matchAll(regex)];

      if (termMatches.length > 0) {
        const positions = termMatches.slice(0, 5).map(match => ({
          page: pageEstimate,
          context: extractContext(text, match.index!, 50)
        }));

        matches.push({
          term,
          category,
          count: termMatches.length,
          positions
        });

        byCategory[category] += termMatches.length;
        totalCount += termMatches.length;
      }
    }
  }

  return {
    totalCount,
    byCategory,
    matches
  };
}

/**
 * Aggregate term counts from multiple chunks
 */
export function aggregateTermCounts(results: TermCountResult[]): TermCountResult {
  const aggregated: TermCountResult = {
    totalCount: 0,
    byCategory: {},
    matches: []
  };

  const termMap = new Map<string, TermMatch>();

  for (const result of results) {
    aggregated.totalCount += result.totalCount;

    // Aggregate by category
    for (const [category, count] of Object.entries(result.byCategory)) {
      aggregated.byCategory[category] = (aggregated.byCategory[category] || 0) + count;
    }

    // Aggregate matches
    for (const match of result.matches) {
      const key = `${match.term}-${match.category}`;
      if (termMap.has(key)) {
        const existing = termMap.get(key)!;
        existing.count += match.count;
        existing.positions.push(...match.positions.slice(0, 2)); // Keep first 2 from each chunk
      } else {
        termMap.set(key, { ...match });
      }
    }
  }

  aggregated.matches = Array.from(termMap.values())
    .sort((a, b) => b.count - a.count);

  return aggregated;
}

/**
 * Extract context around a match
 */
function extractContext(text: string, position: number, radius: number): string {
  const start = Math.max(0, position - radius);
  const end = Math.min(text.length, position + radius);
  let context = text.slice(start, end).trim();

  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Load term lists from database
 */
export async function loadTermListsFromDB(prisma: any): Promise<Record<string, string[]>> {
  const lists = await prisma.termList.findMany({
    where: { isActive: true }
  });

  const termLists: Record<string, string[]> = {};

  for (const list of lists) {
    termLists[list.category.toLowerCase()] = list.terms as string[];
  }

  return Object.keys(termLists).length > 0 ? termLists : DEFAULT_TERM_LISTS;
}
