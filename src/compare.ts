import {isMeaningful} from './chars';

export type MarkKind = 'kept' | 'lost' | 'added' | 'plain';

export interface Mark {
  readonly ch: string;
  readonly kind: MarkKind;
}

export interface Alignment {
  /** The first text; characters missing from the second are `lost`. */
  readonly before: readonly Mark[];
  /** The second text; characters not in the first are `added`. */
  readonly after: readonly Mark[];
  /** Dice coefficient over the longest common subsequence, 0 to 1. */
  readonly similarity: number;
}

export type Verdict =
  'exact' | 'mostly' | 'mixed' | 'rumor' | 'partly' | 'forgotten';

const MOSTLY_MIN = 0.7;
const PARTLY_MIN = 0.35;

/**
 * Lines up two texts by their longest common subsequence. Punctuation, spaces
 * and letter case are ignored, so only the wording is compared.
 */
export function align(before: string, after: string): Alignment {
  const a = Array.from(before);
  const b = Array.from(after);
  const aIndices = meaningfulIndices(a);
  const bIndices = meaningfulIndices(b);
  const x = aIndices.map(i => a[i].toLowerCase());
  const y = bIndices.map(i => b[i].toLowerCase());
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
    before: a.map((ch, k) => markOf(ch, keptA.has(k), 'lost')),
    after: b.map((ch, k) => markOf(ch, keptB.has(k), 'added')),
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
  // Both alignments mark the characters of `carried`, index for index.
  const added = align(origin, carried).after;
  const echoed = align(carried, recall).before;
  return added.some(
    (mark, i) => mark.kind === 'added' && echoed[i].kind === 'kept',
  );
}

function meaningfulIndices(chars: readonly string[]): number[] {
  const indices: number[] = [];
  chars.forEach((ch, i) => {
    if (isMeaningful(ch)) {
      indices.push(i);
    }
  });
  return indices;
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

function markOf(ch: string, kept: boolean, missing: MarkKind): Mark {
  if (!isMeaningful(ch)) {
    return {ch, kind: 'plain'};
  }
  return {ch, kind: kept ? 'kept' : missing};
}
