import {describe, expect, it} from 'vitest';

import {otherLanguage, pickLanguage} from './language';

describe('pickLanguage', () => {
  it('follows an address that asks for a language', () => {
    expect(pickLanguage('?lang=en', 'zh', ['zh-CN'])).toBe('en');
    expect(pickLanguage('?lang=zh', null, ['en-US'])).toBe('zh');
  });

  it('remembers the language the player switched to', () => {
    expect(pickLanguage('', 'en', ['zh-CN'])).toBe('en');
  });

  it('uses the first Chinese or English the browser prefers', () => {
    expect(pickLanguage('', null, ['zh-TW', 'en'])).toBe('zh');
    expect(pickLanguage('', null, ['ja', 'en-GB', 'zh'])).toBe('en');
  });

  it('falls back to English', () => {
    expect(pickLanguage('', null, ['fr', 'de'])).toBe('en');
    expect(pickLanguage('?lang=fr', null, [])).toBe('en');
  });
});

describe('otherLanguage', () => {
  it('leads from each language to the other', () => {
    expect(otherLanguage('zh')).toBe('en');
    expect(otherLanguage('en')).toBe('zh');
  });
});
