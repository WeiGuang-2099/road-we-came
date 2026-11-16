import {hasHan, isMeaningful, wordCount} from './chars';
import type {Random} from './random';

/**
 * What people tend to say instead. Longer phrases claim their characters
 * first, so 回家 can become 回乡 but never 去家.
 */
const PHRASE_SHIFTS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['第一次', ['头一回', '又一次']],
  ['一个人', ['某个人', '两个人']],
  ['为了', ['因为']],
  ['想要', ['希望', '打算']],
  ['想去', ['要去', '打算去']],
  ['看看', ['瞧瞧', '看一眼']],
  ['回家', ['回乡', '离家']],
  ['离开', ['逃离', '告别']],
  ['找到', ['找回', '寻到']],
  ['自己', ['别人', '家人']],
  ['爸爸', ['父亲']],
  ['妈妈', ['母亲']],
  ['父亲', ['爸爸', '父母']],
  ['母亲', ['妈妈', '父母']],
  ['父母', ['家人']],
  ['朋友', ['故人', '老朋友']],
  ['喜欢', ['在乎', '想念']],
  ['忘记', ['记得', '放下']],
  ['忘掉', ['放下']],
  ['梦想', ['念想', '梦']],
  ['自由', ['清闲', '自在']],
  ['答案', ['说法', '理由']],
  ['远方', ['别处', '远处']],
  ['世界', ['天下', '外面']],
  ['大海', ['大湖', '海边']],
  ['工作', ['活计', '差事']],
  ['赚钱', ['还债', '攒钱']],
  ['生活', ['日子', '活法']],
  ['未来', ['以后', '将来']],
  ['过去', ['从前', '往事']],
  ['改变', ['变成', '变回']],
  ['证明', ['说明', '表明']],
  ['告别', ['道别', '重逢']],
  ['道歉', ['解释', '道谢']],
  ['原谅', ['谅解', '忘记']],
  ['真相', ['传言', '说法']],
  ['约定', ['承诺', '说好']],
  ['最后', ['最初', '最终']],
  ['一起', ['一道', '各自']],
  ['一直', ['始终', '曾经']],
  ['永远', ['很久']],
  ['星星', ['灯火', '月亮']],
  ['开心', ['安心', '高兴']],
  ['快乐', ['自在', '高兴']],
  ['勇气', ['力气', '胆子']],
  ['意义', ['用处', '道理']],
  ['海', ['湖', '河']],
  ['山', ['丘', '岭']],
  ['家', ['乡', '屋']],
  ['他', ['她']],
  ['她', ['他']],
  ['爱', ['念']],
  ['找', ['寻', '等']],
  ['见', ['看', '寻']],
  ['看', ['望']],
  ['去', ['回']],
  ['回', ['去']],
  ['想', ['要']],
  ['光', ['火']],
  ['风', ['雨']],
  ['雪', ['雨']],
  ['花', ['草']],
  ['城', ['镇']],
  ['书', ['信']],
  ['信', ['书']],
  ['猫', ['狗']],
  ['狗', ['猫']],
];

const SHIFTS_BY_LENGTH = [...PHRASE_SHIFTS].sort(
  ([a], [b]) => b.length - a.length,
);

/**
 * Words that sound alike. Both sides are real words, so a mishearing reads
 * as a different reason rather than a typo.
 */
const SOUND_ALIKES: ReadonlyArray<readonly [string, string]> = [
  ['回忆', '会议'],
  ['经历', '精力'],
  ['事业', '视野'],
  ['梦想', '梦乡'],
  ['理想', '离乡'],
  ['远方', '远房'],
  ['告别', '告白'],
  ['旅行', '履行'],
  ['世界', '视界'],
  ['一生', '医生'],
  ['生活', '生火'],
  ['意义', '异议'],
  ['证明', '正名'],
  ['改变', '改编'],
  ['快乐', '快了'],
  ['天空', '填空'],
  ['大学', '大雪'],
  ['星星', '猩猩'],
  ['约定', '预定'],
  ['真相', '真像'],
];

const HEARD_AS = new Map<string, string>(
  SOUND_ALIKES.flatMap(([a, b]): Array<[string, string]> => [
    [a, b],
    [b, a],
  ]),
);

// Splits Chinese into words, so a one-character shift like 回 → 去 only
// touches a character that stands alone and never breaks up 回忆.
const WORDS =
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('zh', {granularity: 'word'})
    : null;

const WORD_SHIFTS = new Map<string, readonly string[]>([
  ['home', ['house', 'hometown']],
  ['sea', ['lake']],
  ['ocean', ['lake', 'sea']],
  ['mother', ['mom']],
  ['mom', ['mother']],
  ['father', ['dad']],
  ['dad', ['father']],
  ['find', ['seek', 'lose']],
  ['love', ['miss']],
  ['forget', ['remember']],
  ['remember', ['forget']],
  ['myself', ['someone']],
  ['friend', ['stranger']],
  ['leave', ['escape']],
  ['see', ['visit']],
  ['mountain', ['hill']],
  ['free', ['idle']],
  ['dream', ['wish']],
  ['answer', ['excuse']],
  ['truth', ['rumor']],
  ['together', ['alone']],
  ['alone', ['together']],
  ['always', ['once']],
  ['never', ['once']],
  ['grandmother', ['grandma']],
  ['grandma', ['grandmother']],
  ['brother', ['sister']],
  ['sister', ['brother']],
  ['family', ['folks', 'people']],
  ['city', ['town']],
  ['town', ['village']],
  ['river', ['stream']],
  ['stars', ['lights']],
  ['travel', ['wander']],
  ['journey', ['trip']],
  ['start', ['begin']],
  ['begin', ['start']],
  ['escape', ['leave']],
  ['lost', ['left']],
  ['promise', ['deal']],
  ['goodbye', ['hello']],
  ['sorry', ['thanks']],
  ['forgive', ['forget']],
  ['someone', ['somebody', 'anyone']],
  ['everything', ['anything']],
  ['nothing', ['everything']],
  ['happy', ['content']],
  ['brave', ['bold']],
  ['quiet', ['silence']],
  ['peace', ['rest']],
  ['again', ['once more']],
  ['back', ['away']],
  ['away', ['back']],
  ['world', ['country']],
  ['work', ['job']],
]);

/**
 * English words that sound alike, so a passerby may pass on the other one.
 * Both sides are real words, as with SOUND_ALIKES.
 */
const HOMOPHONES: ReadonlyArray<readonly [string, string]> = [
  ['sea', 'see'],
  ['past', 'passed'],
  ['mist', 'missed'],
  ['morning', 'mourning'],
  ['whole', 'hole'],
  ['peace', 'piece'],
  ['write', 'right'],
  ['son', 'sun'],
  ['road', 'rode'],
  ['here', 'hear'],
  ['dear', 'deer'],
  ['tale', 'tail'],
  ['week', 'weak'],
  ['soul', 'sole'],
  ['heal', 'heel'],
  ['wait', 'weight'],
  ['rain', 'reign'],
  ['seen', 'scene'],
  ['aloud', 'allowed'],
  ['meet', 'meat'],
  ['night', 'knight'],
  ['flower', 'flour'],
  ['whether', 'weather'],
  ['wonder', 'wander'],
];

const HEARD_AS_WORD = new Map<string, readonly string[]>(
  HOMOPHONES.flatMap(([a, b]): Array<[string, readonly string[]]> => [
    [a, [b]],
    [b, [a]],
  ]),
);

const WORD = /[A-Za-z']+/g;

/** Returns a changed copy of `text`, or null when the change does not apply. */
type Change = (text: string, random: Random) => string | null;

const HAN_CHANGES: ReadonlyArray<readonly [Change, number]> = [
  [shiftPhrase, 5],
  [dropChar, 3],
  [mishear, 2],
];

const LATIN_CHANGES: ReadonlyArray<readonly [Change, number]> = [
  [shiftWord, 5],
  [mishearWord, 3],
  [dropWord, 3],
  [swapLetters, 1],
];

/** Retells `text` the way a passerby would, with `steps` small changes. */
export function drift(text: string, steps: number, random: Random): string {
  let result = text;
  for (let step = 0; step < steps; step++) {
    result = driftOnce(result, random);
  }
  return result;
}

/**
 * A retelling can lose words, but never so many that fewer than this are
 * left. A short reason then reaches the ferry with a word to spare.
 */
const FEWEST_WORDS = 2;

function driftOnce(text: string, random: Random): string {
  const floor = Math.min(wordCount(text), FEWEST_WORDS);
  const changes = [...(hasHan(text) ? HAN_CHANGES : LATIN_CHANGES)];
  while (changes.length > 0) {
    const index = weightedIndex(
      changes.map(([, weight]) => weight),
      random,
    );
    const [change] = changes.splice(index, 1)[0];
    const result = change(text, random);
    if (result !== null && result !== text && wordCount(result) >= floor) {
      return result;
    }
  }
  return text;
}

interface PhraseMatch {
  readonly at: number;
  readonly from: string;
  readonly to: readonly string[];
}

function shiftPhrase(text: string, random: Random): string | null {
  const standalone = standaloneChars(text);
  const claimed = new Set<number>();
  const matches: PhraseMatch[] = [];
  for (const [from, to] of SHIFTS_BY_LENGTH) {
    for (
      let at = text.indexOf(from);
      at >= 0;
      at = text.indexOf(from, at + 1)
    ) {
      const span = Array.from({length: from.length}, (_, k) => at + k);
      if (
        span.some(position => claimed.has(position)) ||
        (from.length === 1 && !standalone.has(at))
      ) {
        continue;
      }
      span.forEach(position => claimed.add(position));
      matches.push({at, from, to});
    }
  }
  if (matches.length === 0) {
    return null;
  }
  const match =
    matches[
      weightedIndex(
        matches.map(m => m.from.length),
        random,
      )
    ];
  return (
    text.slice(0, match.at) +
    random.pick(match.to) +
    text.slice(match.at + match.from.length)
  );
}

function dropChar(text: string, random: Random): string | null {
  const chars = Array.from(text);
  const candidates = indicesWhere(chars, isMeaningful);
  if (candidates.length < 2) {
    return null;
  }
  chars.splice(random.pick(candidates), 1);
  return chars.join('');
}

function mishear(text: string, random: Random): string | null {
  const heard = [...HEARD_AS].filter(([word]) => text.includes(word));
  if (heard.length === 0) {
    return null;
  }
  const [word, alike] = random.pick(heard);
  return text.replace(word, alike);
}

/** Positions (UTF-16) of characters that form a word on their own. */
function standaloneChars(text: string): Set<number> {
  const positions = new Set<number>();
  if (!WORDS) {
    for (let i = 0; i < text.length; i++) {
      positions.add(i);
    }
    return positions;
  }
  for (const {segment, index} of WORDS.segment(text)) {
    if (segment.length === 1) {
      positions.add(index);
    }
  }
  return positions;
}

function shiftWord(text: string, random: Random): string | null {
  return replaceWord(text, random, WORD_SHIFTS);
}

function mishearWord(text: string, random: Random): string | null {
  return replaceWord(text, random, HEARD_AS_WORD);
}

/** Replaces one word found in `table` with one of the words it maps to. */
function replaceWord(
  text: string,
  random: Random,
  table: ReadonlyMap<string, readonly string[]>,
): string | null {
  const matches = [...text.matchAll(WORD)].filter(m =>
    table.has(m[0].toLowerCase()),
  );
  if (matches.length === 0) {
    return null;
  }
  const match = random.pick(matches);
  const options = table.get(match[0].toLowerCase());
  if (!options) {
    return null;
  }
  const replacement = matchCase(match[0], random.pick(options));
  return (
    text.slice(0, match.index) +
    replacement +
    text.slice(match.index + match[0].length)
  );
}

function dropWord(text: string, random: Random): string | null {
  const matches = [...text.matchAll(WORD)];
  if (matches.length < 3) {
    return null;
  }
  const match = random.pick(matches);
  const rest = text.slice(match.index + match[0].length).replace(/^\s/, '');
  return (text.slice(0, match.index) + rest).replace(/\s{2,}/g, ' ').trim();
}

function swapLetters(text: string, random: Random): string | null {
  const matches = [...text.matchAll(WORD)].filter(m => m[0].length >= 4);
  if (matches.length === 0) {
    return null;
  }
  const match = random.pick(matches);
  const word = match[0];
  const i = 1 + random.int(word.length - 2);
  const swapped = word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
  return (
    text.slice(0, match.index) + swapped + text.slice(match.index + word.length)
  );
}

function matchCase(source: string, word: string): string {
  const first = source.charAt(0);
  return first === first.toUpperCase() && first !== first.toLowerCase()
    ? word.charAt(0).toUpperCase() + word.slice(1)
    : word;
}

function indicesWhere(
  chars: readonly string[],
  test: (ch: string) => boolean,
): number[] {
  const indices: number[] = [];
  chars.forEach((ch, i) => {
    if (test(ch)) {
      indices.push(i);
    }
  });
  return indices;
}

function weightedIndex(weights: readonly number[], random: Random): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random.next() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) {
      return i;
    }
  }
  return weights.length - 1;
}
