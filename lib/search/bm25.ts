/**
 * Pure TypeScript BM25 scoring implementation.
 * Used for text-based re-ranking in hybrid search (vector + BM25).
 */

const DEFAULT_K1 = 1.5;
const DEFAULT_B = 0.75;

/**
 * Tokenize text into lowercase terms.
 * Handles both Korean and English by splitting on whitespace and punctuation.
 */
export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

interface BM25Result {
  index: number;
  score: number;
}

/**
 * Compute BM25 scores for a query against a set of documents.
 * Returns documents sorted by score descending.
 */
export function computeBM25Scores(
  query: string,
  documents: string[],
  options?: { k1?: number; b?: number }
): BM25Result[] {
  const k1 = options?.k1 ?? DEFAULT_K1;
  const b = options?.b ?? DEFAULT_B;

  if (!query || documents.length === 0) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  // Tokenize all documents
  const docTokens = documents.map(tokenize);
  const N = documents.length;

  // Average document length
  const avgDl =
    docTokens.reduce((sum, tokens) => sum + tokens.length, 0) / N;

  // Document frequency: how many documents contain each term
  const df = new Map<string, number>();
  for (const tokens of docTokens) {
    const seen = new Set(tokens);
    for (const term of seen) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  // Compute BM25 score for each document
  const results: BM25Result[] = [];
  for (let i = 0; i < N; i++) {
    const tokens = docTokens[i];
    const dl = tokens.length;

    // Term frequency map for this document
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }

    let score = 0;
    for (const term of queryTerms) {
      const termDf = df.get(term) ?? 0;
      if (termDf === 0) continue;

      const termTf = tf.get(term) ?? 0;
      if (termTf === 0) continue;

      // IDF: log((N - df + 0.5) / (df + 0.5) + 1)
      const idf = Math.log((N - termDf + 0.5) / (termDf + 0.5) + 1);

      // BM25 TF component
      const tfNorm = (termTf * (k1 + 1)) / (termTf + k1 * (1 - b + b * (dl / avgDl)));

      score += idf * tfNorm;
    }

    if (score > 0) {
      results.push({ index: i, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
