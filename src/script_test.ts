import {describe, expect, it} from 'vitest';

import {REASON, type Script, type Station, type Visit} from './script';
import {EN} from './script_en';
import {ZH} from './script_zh';

/** Every visit a station can be heard on, the first one first. */
function visitsTo(station: Station): Visit[] {
  return [station.first, ...station.later];
}

/** Every string in a script, wherever it sits. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (typeof value === 'function') {
    return [String((value as (arg: unknown) => unknown)(2))];
  }
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(strings);
  }
  return [];
}

describe.each([
  ['Chinese', ZH],
  ['English', EN],
] as const)('the %s script', (_name, script: Script) => {
  it('quotes the reason in every rumor and in the last-time line', () => {
    for (const station of Object.values(script.stations)) {
      for (const visit of visitsTo(station)) {
        expect(visit.rumor).toContain(REASON);
      }
    }
    expect(script.summit.lastTime).toContain(REASON);
  });

  it('opens every visit to a station differently', () => {
    for (const station of Object.values(script.stations)) {
      const visits = visitsTo(station);
      const openings = new Set(visits.map(visit => visit.intro[0]));
      const rumors = new Set(visits.map(visit => visit.rumor));
      expect(openings.size).toBe(visits.length);
      expect(rumors.size).toBe(visits.length);
    }
  });

  it('names every place differently', () => {
    const places = [
      ...Object.values(script.stations).map(station => station.place),
      script.ferry.place,
      script.gate.place,
      script.summit.place,
    ];
    expect(new Set(places).size).toBe(places.length);
  });
});

describe('the English script', () => {
  it('leaves no Chinese except the seal', () => {
    const {seal} = EN.summit;
    const chinese = strings(EN).filter(
      text => text !== seal && /\p{Script=Han}/u.test(text),
    );
    expect(chinese).toEqual([]);
  });
});
