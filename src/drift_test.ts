import {describe, expect, it} from 'vitest';

import {hasMeaningfulChars} from './chars';
import {drift} from './drift';
import {Random} from './random';

const SEEDS = Array.from({length: 300}, (_, i) => i);

describe('drift', () => {
  it('gives the same retelling for the same seed', () => {
    const text = '想去看看海，看它到底有多大';
    expect(drift(text, 3, new Random(42))).toBe(drift(text, 3, new Random(42)));
  });

  it('changes a reason it knows how to change', () => {
    for (const seed of SEEDS) {
      expect(drift('想去看看海', 1, new Random(seed))).not.toBe('想去看看海');
    }
  });

  it('never wears a reason down to nothing', () => {
    for (const seed of SEEDS) {
      const result = drift('看海', 5, new Random(seed));
      expect(hasMeaningfulChars(result)).toBe(true);
    }
  });

  it('leaves text alone when nothing applies', () => {
    expect(drift('。', 3, new Random(1))).toBe('。');
  });

  it('does not split a known phrase to swap one of its characters', () => {
    const results = new Set(
      SEEDS.map(seed => drift('回家', 1, new Random(seed))),
    );
    expect(results.has('回乡')).toBe(true);
    expect(results.has('去家')).toBe(false);
    expect(results.has('回屋')).toBe(false);
  });

  it('only swaps a single character when it is a word on its own', () => {
    const results = new Set(
      SEEDS.map(seed => drift('想起回忆', 1, new Random(seed))),
    );
    expect(results.has('想起去忆')).toBe(false);
    expect(results.has('想起会议')).toBe(true);
  });

  it('mishears whole words, never single characters', () => {
    const results = SEEDS.map(seed => drift('为了旅行', 1, new Random(seed)));
    expect(results).toContain('为了履行');
    expect(results.every(result => !result.includes('趣'))).toBe(true);
  });

  it('retells English reasons word by word', () => {
    const text = 'I want to see the sea';
    const results = SEEDS.map(seed => drift(text, 1, new Random(seed)));
    expect(results.every(result => result !== text)).toBe(true);
    expect(results).toContain('I want to visit the sea');
  });
});
