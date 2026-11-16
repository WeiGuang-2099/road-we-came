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

/** Removes one character, counting by code point rather than UTF-16 unit. */
export function removeCharAt(text: string, index: number): string {
  const chars = Array.from(text);
  chars.splice(index, 1);
  return chars.join('');
}
