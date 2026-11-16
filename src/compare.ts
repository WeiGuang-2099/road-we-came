import {type Part, partsOf} from './chars';

export type MarkKind = 'kept' | 'lost' | 'added' | 'plain';

export interface Mark {
  /** A word, a Chinese character, or what lies between two words. */
  readonly text: string;
  readonly kind: MarkKind;
}

export interface Alignment {
  /** The first text; words missing from the second are `lost`. */
  readonly before: readonly Mark[];
  /** The second text; words not in the first are `added`. */
  readonly after: readonly Mark[];
  /** Dice coefficient over the longest common subsequence, 0 to 1. */
  readonly similarity: number;
}

export type Verdict =
  'exact' | 'mostly' | 'mixed' | 'rumor' | 'partly' | 'forgotten';

const MOSTLY_MIN = 0.7;
const PARTLY_MIN = 0.35;

/**
 * Lines up two texts by their longest common subsequence of words, where
 * each Chinese character counts as a word. Punctuation, spaces and letter
 * case are ignored, so only the wording is compared.
 */
export function align(before: string, after: string): Alignment {
  const a = partsOf(before);
  const b = partsOf(after);
  const aIndices = wordIndices(a);
  const bIndices = wordIndices(b);
  const x = aIndices.map(i => comparable(a[i]));
  const y = bIndices.map(i => comparable(b[i]));
  const table = lcsTable(x, y);

  const keptA = new Set<number>();
  const keptB = new Set<number>();
  let i = x.length;
  let j = y.length;
  while (i > 0 && j > 0) {
    if (x[i - 1] === y[j - 1]) {
      keptA.add(aIndices[i - 1]);
      keptB.add(bIndices[j - 1]);
      i--;
      j--;
    } else if (table[i - 1][j] >= table[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const total = x.length + y.length;
  return {
    before: a.map((part, k) => markOf(part, keptA.has(k), 'lost')),
    after: b.map((part, k) => markOf(part, keptB.has(k), 'added')),
    similarity: total === 0 ? 1 : (2 * keptA.size) / total,
  };
}

export function similarity(a: string, b: string): number {
  return align(a, b).similarity;
}

/** Decides how the recalled reason relates to the original and the rumor. */
export function judge(
  origin: string,
  carried: string,
  recall: string,
): Verdict {
  const toOrigin = similarity(origin, recall);
  if (toOrigin === 1) {
    return 'exact';
  }
  const echoesRumor = repeatsRumor(origin, carried, recall);
  if (echoesRumor && similarity(carried, recall) >= toOrigin) {
    return 'rumor';
  }
  if (toOrigin >= MOSTLY_MIN) {
    // Mostly the player's own words, but some of the road's slipped in.
    return echoesRumor ? 'mixed' : 'mostly';
  }
  return toOrigin >= PARTLY_MIN ? 'partly' : 'forgotten';
}

/** True if the recall repeats wording the road added and the player never wrote. */
function repeatsRumor(
  origin: string,
  carried: string,
  recall: string,
): boolean {
  // Both alignments mark the parts of `carried`, index for index.
  const added = align(origin, carried).after;
  const echoed = align(carried, recall).before;
  return added.some(
    (mark, i) => mark.kind === 'added' && echoed[i].kind === 'kept',
  );
}

function wordIndices(parts: readonly Part[]): number[] {
  const indices: number[] = [];
  parts.forEach((part, i) => {
    if (part.word) {
      indices.push(i);
    }
  });
  return indices;
}

/** A word as compared: case and the shape of its apostrophe do not count. */
function comparable(part: Part): string {
  return part.text.toLowerCase().replace(/’/g, "'");
}

function lcsTable(x: readonly string[], y: readonly string[]): number[][] {
  const table = Array.from({length: x.length + 1}, () =>
    new Array<number>(y.length + 1).fill(0),
  );
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      table[i][j] =
        x[i - 1] === y[j - 1]
          ? table[i - 1][j - 1] + 1
          : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table;
}

function markOf(part: Part, kept: boolean, missing: MarkKind): Mark {
  if (!part.word) {
    return {text: part.text, kind: 'plain'};
  }
  return {text: part.text, kind: kept ? 'kept' : missing};
}
