const IGNORED = /[\p{P}\p{S}\p{Z}\s]/u;
const HAN = /\p{Script=Han}/u;

/** Punctuation, symbols and spaces do not count as part of the wording. */
export function isMeaningful(ch: string): boolean {
  return !IGNORED.test(ch);
}

export function hasHan(text: string): boolean {
  return HAN.test(text);
}

export function hasMeaningfulChars(text: string): boolean {
  return Array.from(text).some(isMeaningful);
}

/** A piece of a sentence: a word, or what lies between two words. */
export interface Part {
  readonly text: string;
  /** True for a word. Each Chinese character is a word of its own. */
  readonly word: boolean;
}

// A letter or digit of any script but Han.
const LETTER = String.raw`(?:(?!\p{Script=Han})[\p{L}\p{M}\p{N}])`;
// A Chinese character; a run of letters, keeping apostrophes inside it as in
// "don't"; or any other single character.
const PARTS = new RegExp(
  String.raw`\p{Script=Han}|${LETTER}+(?:['’]${LETTER}+)*|[^]`,
  'gu',
);
const WORDLIKE = /[\p{L}\p{N}]/u;

/** Splits text into its words and what lies between them. */
export function partsOf(text: string): Part[] {
  return Array.from(text.matchAll(PARTS), ([piece]) => ({
    text: piece,
    word: WORDLIKE.test(piece),
  }));
}

/** True if any word is left in `text`. */
export function hasWords(text: string): boolean {
  return partsOf(text).some(part => part.word);
}

/** Removes the part at `index` and tidies the space it leaves behind. */
export function withoutPart(text: string, index: number): string {
  const parts = partsOf(text).map(part => part.text);
  parts.splice(index, 1);
  return parts
    .join('')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+(?=[,.;:!?，。；：！？])/g, '')
    .trim();
}
