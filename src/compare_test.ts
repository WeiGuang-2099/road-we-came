import {describe, expect, it} from 'vitest';

import {align, judge, similarity} from './compare';

describe('align', () => {
  it('scores identical wording as 1, ignoring punctuation and case', () => {
    expect(similarity('想去看看海。', '想去看看海')).toBe(1);
    expect(similarity('See the Sea!', 'see the sea')).toBe(1);
  });

  it('marks forgotten and invented characters', () => {
    const {before, after, similarity: score} = align('想去看看海', '想去看湖');
    expect(before.filter(m => m.kind === 'lost').map(m => m.ch)).toHaveLength(
      2,
    );
    expect(after.filter(m => m.kind === 'added').map(m => m.ch)).toEqual([
      '湖',
    ]);
    expect(score).toBeCloseTo(6 / 9);
  });

  it('marks punctuation as plain', () => {
    const {before} = align('看海，', '看海');
    expect(before.map(m => m.kind)).toEqual(['kept', 'kept', 'plain']);
  });

  it('handles empty text', () => {
    expect(similarity('', '')).toBe(1);
    expect(similarity('看海', '')).toBe(0);
  });
});

describe('judge', () => {
  const origin = '想去看看海，看它到底有多大';

  it('accepts an exact recall', () => {
    expect(judge(origin, '要去瞧瞧湖', '想去看看海，看它到底有多大。')).toBe(
      'exact',
    );
  });

  it('notices when the rumor replaced the memory', () => {
    const carried = '要去瞧瞧湖，看它有多大';
    expect(judge(origin, carried, carried)).toBe('rumor');
    expect(judge(origin, carried, '要去看看湖')).toBe('rumor');
  });

  it('notices rumor words mixed into a memory mostly kept', () => {
    const carried = '要去瞧瞧湖，看它有多大';
    expect(judge(origin, carried, '想去看看湖，看它有多大')).toBe('mixed');
  });

  it('does not blame the rumor when it only lost words', () => {
    expect(judge(origin, '去看', '想去看海')).toBe('partly');
  });

  it('grades partial recall', () => {
    expect(judge(origin, origin, '想去看看海，看它多大')).toBe('mostly');
    expect(judge(origin, origin, '想看海')).toBe('partly');
    expect(judge(origin, origin, '为了自由')).toBe('forgotten');
  });
});
