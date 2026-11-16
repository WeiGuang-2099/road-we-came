import {beforeEach, describe, expect, it} from 'vitest';

import {MemoryStorage} from './memory_storage';
import {type Journey, type Run, SaveStore} from './save';

const RUN: Run = {
  version: 1,
  seed: 7,
  stage: 2,
  origin: '想去看看海',
  carried: '想去看看湖',
  startedAt: 0,
};

const JOURNEY: Journey = {
  origin: '想去看看海',
  carried: '想去看看湖',
  recall: '想去看海',
  score: 0.89,
  endedAt: 0,
};

describe('SaveStore', () => {
  let storage: MemoryStorage;
  let store: SaveStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    store = new SaveStore(storage);
  });

  it('round-trips a run under the project prefix', () => {
    store.saveRun(RUN);
    expect(store.loadRun()).toEqual(RUN);
    expect(storage.getItem('laishilu:v1:run')).not.toBeNull();
    store.clearRun();
    expect(store.loadRun()).toBeNull();
  });

  it('ignores corrupt or foreign data', () => {
    storage.setItem('laishilu:v1:run', '{not json');
    expect(store.loadRun()).toBeNull();
    storage.setItem('laishilu:v1:run', JSON.stringify({stage: 'x'}));
    expect(store.loadRun()).toBeNull();
  });

  it('counts finished journeys', () => {
    expect(store.addJourney(JOURNEY)).toBe(1);
    expect(store.addJourney(JOURNEY)).toBe(2);
    expect(store.loadHistory()).toEqual([JOURNEY, JOURNEY]);
  });

  it('remembers the sound setting', () => {
    expect(store.isMuted()).toBe(false);
    store.setMuted(true);
    expect(store.isMuted()).toBe(true);
  });

  it('forgets every journey but keeps the sound setting', () => {
    store.saveRun(RUN);
    store.addJourney(JOURNEY);
    store.setMuted(true);
    store.forget();
    expect(store.loadRun()).toBeNull();
    expect(store.loadHistory()).toEqual([]);
    expect(store.isMuted()).toBe(true);
  });

  it('remembers the language switched to, even after forgetting', () => {
    expect(store.language()).toBeNull();
    store.setLanguage('en');
    store.forget();
    expect(store.language()).toBe('en');
  });

  it('keeps working without storage', () => {
    const offline = new SaveStore(null);
    offline.saveRun(RUN);
    expect(offline.loadRun()).toBeNull();
    expect(offline.addJourney(JOURNEY)).toBe(1);
  });
});
