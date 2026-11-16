import {describe, expect, it} from 'vitest';

import {hasWords, partsOf, withoutPart, wordCount} from './chars';

const words = (text: string): string[] =>
  partsOf(text)
    .filter(part => part.word)
    .map(part => part.text);

describe('partsOf', () => {
  it('counts each Chinese character as a word', () => {
    expect(words('想去看看海，好吗')).toEqual([
      '想',
      '去',
      '看',
      '看',
      '海',
      '好',
      '吗',
    ]);
  });

  it('keeps English words whole, apostrophes and all', () => {
    expect(words("I don't want to go, really.")).toEqual([
      'I',
      "don't",
      'want',
      'to',
      'go',
      'really',
    ]);
  });

  it('splits mixed text between the two', () => {
    expect(words('去看 sea 吧')).toEqual(['去', '看', 'sea', '吧']);
  });

  it('keeps every character of the text', () => {
    const text = '“Hello,” 你好 — again!';
    expect(
      partsOf(text)
        .map(part => part.text)
        .join(''),
    ).toBe(text);
  });
});

describe('withoutPart', () => {
  it('takes a word and the space it leaves', () => {
    const text = 'I want to see the sea before I turn thirty';
    const sea = partsOf(text).findIndex(part => part.text === 'sea');
    expect(withoutPart(text, sea)).toBe(
      'I want to see the before I turn thirty',
    );
  });

  it('does not leave a space before punctuation', () => {
    const text = 'I miss the sea.';
    const sea = partsOf(text).findIndex(part => part.text === 'sea');
    expect(withoutPart(text, sea)).toBe('I miss the.');
  });

  it('takes a single Chinese character', () => {
    expect(withoutPart('看海。', 1)).toBe('看。');
  });
});

describe('hasWords', () => {
  it('ignores punctuation and spaces', () => {
    expect(hasWords('。 …')).toBe(false);
    expect(hasWords('海')).toBe(true);
  });
});

describe('wordCount', () => {
  it('counts Chinese characters and whole English words', () => {
    expect(wordCount('看海。')).toBe(2);
    expect(wordCount("I don't know")).toBe(3);
    expect(wordCount('看 the 海')).toBe(3);
  });

  it('counts a run of letters as one word', () => {
    expect(wordCount('asdf')).toBe(1);
    expect(wordCount('。 …')).toBe(0);
  });
});
