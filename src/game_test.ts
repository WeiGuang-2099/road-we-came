import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {Game, type GameView} from './game';
import {MemoryStorage} from './memory_storage';
import {SaveStore} from './save';
import {
  FERRY,
  GATE,
  NEXT,
  ORIGIN,
  REASON,
  REPLIES,
  STATIONS,
  SUMMIT,
  TITLE,
  VERDICTS,
} from './script';
import type {ComparisonRow, WriteOptions, Written} from './view';

/** One thing the player does: click a button, write a line, or pay a character. */
type Answer =
  {readonly pick: string} | {readonly write: string} | {readonly give: string};

const pick = (label: string): Answer => ({pick: label});
const write = (text: string): Answer => ({write: text});
const give = (ch: string): Answer => ({give: ch});

// Game only removes or dissolves the written line; it never reads from it.
const LINE = {remove: (): void => {}} as unknown as HTMLElement;

/** An index, or undefined when what the script asks for is not on offer. */
function found(index: number): number | undefined {
  return index >= 0 ? index : undefined;
}

/**
 * Plays through a script of answers and records what the page would show.
 * When the script runs out, or its next answer does not fit, the game is left
 * waiting on that prompt, like a page left open until the player reloads it.
 */
class ScriptedView implements GameView {
  readonly answers: Answer[];
  /** The buttons offered by every choice, in order. */
  readonly offered: (readonly string[])[] = [];
  /** Every retelling a station put to the player. */
  readonly rumors: string[] = [];
  readonly lines: string[] = [];
  road: string[] = [];
  /** The summit comparison, one string per row. */
  rows: string[] = [];
  inscribed = '';
  /** The prompt the game was left waiting on. */
  waitingOn = '';
  readonly stopped: Promise<void>;
  private stop: () => void = () => {};

  constructor(answers: readonly Answer[]) {
    this.answers = [...answers];
    this.stopped = new Promise(resolve => {
      this.stop = resolve;
    });
  }

  enter(place = ''): Promise<void> {
    if (place) {
      this.road.push(place);
    }
    return Promise.resolve();
  }

  setRoad(places: readonly string[]): void {
    this.road = [...places];
  }

  showTitle(_name: string, note: string): void {
    this.lines.push(note);
  }

  say(text: string, reason?: string): Promise<void> {
    if (
      reason !== undefined &&
      STATIONS.some(station => station.rumor === text)
    ) {
      this.rumors.push(reason);
    }
    this.lines.push(reason === undefined ? text : text.replace(REASON, reason));
    return Promise.resolve();
  }

  note(text: string): void {
    this.lines.push(text);
  }

  premise(text: string): Promise<void> {
    this.lines.push(text);
    return Promise.resolve();
  }

  choose(
    labels: readonly string[],
    quiet: readonly string[] = [],
  ): Promise<number> {
    const offered = [...labels, ...quiet];
    this.offered.push(offered);
    return this.answer(offered.join(' | '), answer =>
      'pick' in answer ? found(offered.indexOf(answer.pick)) : undefined,
    );
  }

  async proceed(label: string): Promise<void> {
    await this.choose([label]);
  }

  write(options: WriteOptions): Promise<Written> {
    return this.answer(options.placeholder, answer =>
      'write' in answer ? {text: answer.write, node: LINE} : undefined,
    );
  }

  dissolve(): Promise<void> {
    return Promise.resolve();
  }

  pickChar(text: string): Promise<number> {
    return this.answer(text, answer =>
      'give' in answer
        ? found(Array.from(text).indexOf(answer.give))
        : undefined,
    );
  }

  showScroll(): void {}

  inscribe(text: string): Promise<void> {
    this.inscribed = text;
    return Promise.resolve();
  }

  showComparison(rows: readonly ComparisonRow[]): void {
    this.rows = rows.map(
      row => row.marks.map(mark => mark.ch).join('') || (row.placeholder ?? ''),
    );
  }

  private answer<T>(
    prompt: string,
    read: (answer: Answer) => T | undefined,
  ): Promise<T> {
    const value = this.answers.length > 0 ? read(this.answers[0]) : undefined;
    if (value === undefined) {
      this.waitingOn = prompt;
      this.stop();
      return new Promise<T>(() => {});
    }
    this.answers.shift();
    return Promise.resolve(value);
  }
}

/** Opens the game on `storage` and plays `answers` until they run out. */
async function play(
  storage: Storage,
  answers: readonly Answer[],
): Promise<ScriptedView> {
  const view = new ScriptedView(answers);
  void new Game(view, new SaveStore(storage), {start() {}}).start();
  await view.stopped;
  if (view.answers.length > 0) {
    throw new Error(
      `Stuck at "${view.waitingOn}" with ${JSON.stringify(view.answers)} left`,
    );
  }
  return view;
}

const WHY = '想去看看海';
const RECALL = '想去看海';

const STAGES = [
  'origin',
  'teahouse',
  'inn',
  'bridge',
  'ferry',
  'gate',
  'summit',
] as const;
type Stage = (typeof STAGES)[number];

/** How the player answers at each stage of a whole journey. */
const ANSWERS: Record<Stage, readonly Answer[]> = {
  origin: [write(WHY), pick(ORIGIN.next)],
  teahouse: [pick(REPLIES.accept), pick(NEXT)],
  inn: [pick(REPLIES.deny), write(WHY), pick(NEXT)],
  // Retelling the reason here fixes what reaches the ferry, whatever the
  // rumors were.
  bridge: [pick(REPLIES.deny), write(WHY), pick(NEXT)],
  ferry: [give('海'), pick(NEXT)],
  gate: [pick(NEXT)],
  summit: [write(RECALL)],
};

/** The answers from the start of `stage` to the summit. */
function from(stage: Stage): Answer[] {
  return STAGES.slice(STAGES.indexOf(stage)).flatMap(s => ANSWERS[s]);
}

/** The answers given before `stage` begins. */
function before(stage: Stage): Answer[] {
  return STAGES.slice(0, STAGES.indexOf(stage)).flatMap(s => ANSWERS[s]);
}

const WHOLE_JOURNEY = [pick(TITLE.start), ...from('origin')];
const PLACES = [
  ...STATIONS.map(station => station.place),
  FERRY.place,
  GATE.place,
  SUMMIT.place,
];

interface Reload {
  readonly when: string;
  /** The answers given before the page is reloaded. */
  readonly played: readonly Answer[];
  /** The stage the journey should pick up from. */
  readonly resumes: Stage;
}

const RELOADS: readonly Reload[] = [
  {
    when: 'after the reason is written',
    played: [write(WHY)],
    resumes: 'teahouse',
  },
  {
    when: 'while the teahouse waits for an answer',
    played: before('teahouse'),
    resumes: 'teahouse',
  },
  {
    when: 'while the reason is retold at the inn',
    played: [...before('inn'), pick(REPLIES.deny)],
    resumes: 'inn',
  },
  {
    when: 'after answering at the bridge',
    played: [...before('bridge'), pick(REPLIES.deny), write(WHY)],
    resumes: 'ferry',
  },
  {when: 'while choosing the fare', played: before('ferry'), resumes: 'ferry'},
  {
    when: 'after paying the fare',
    played: [...before('ferry'), give('海')],
    resumes: 'gate',
  },
  {when: 'at the mountain gate', played: before('gate'), resumes: 'summit'},
  {
    when: 'before writing at the summit',
    played: before('summit'),
    resumes: 'summit',
  },
];

describe('Game', () => {
  beforeEach(() => {
    // A fixed seed, so every journey here hears the same rumors.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('walks from the title to the summit', async () => {
    const storage = new MemoryStorage();
    const view = await play(storage, WHOLE_JOURNEY);

    expect(view.offered[0]).toEqual([TITLE.start]);
    expect(view.waitingOn).toBe(SUMMIT.again);
    expect(view.road).toEqual(PLACES);
    expect(view.rumors).toHaveLength(STATIONS.length);
    // The ferry took 海 from the reason retold at the bridge.
    expect(view.rows).toEqual([WHY, '想去看看', RECALL]);
    expect(view.inscribed).toBe(RECALL);
    expect(view.lines).toContain(VERDICTS.mostly);
    // A first journey has no earlier reason to recall.
    expect(view.lines).not.toContain(SUMMIT.sameAsLast);
    expect(view.lines.join('\n')).not.toContain(
      SUMMIT.lastTime.split(REASON)[0],
    );

    const store = new SaveStore(storage);
    expect(store.loadRun()).toBeNull();
    expect(store.loadHistory()).toMatchObject([
      {origin: WHY, carried: '想去看看', recall: RECALL},
    ]);
  });

  it('carries on with the words the player retells', async () => {
    const storage = new MemoryStorage();
    await play(storage, [
      pick(TITLE.start),
      ...before('inn'),
      pick(REPLIES.deny),
      write('回家看看'),
      pick(NEXT),
    ]);

    expect(new SaveStore(storage).loadRun()).toMatchObject({
      stage: STAGES.indexOf('bridge'),
      carried: '回家看看',
    });
  });

  it('says so when the ferry took the last character left', async () => {
    const view = await play(new MemoryStorage(), [
      pick(TITLE.start),
      ...before('bridge'),
      pick(REPLIES.deny),
      write('海'),
      pick(NEXT),
      ...from('ferry'),
    ]);

    expect(view.rows[1]).toBe(SUMMIT.nothingCarried);
  });

  it('counts the journeys that reach the summit', async () => {
    const view = await play(new MemoryStorage(), [
      ...WHOLE_JOURNEY,
      pick(SUMMIT.again),
      ...from('origin'),
    ]);

    expect(view.lines).not.toContain(SUMMIT.count(1));
    expect(view.lines).toContain(SUMMIT.count(2));
  });

  it('recalls the reason written on the journey before', async () => {
    const view = await play(new MemoryStorage(), [
      ...WHOLE_JOURNEY,
      pick(SUMMIT.again),
      write('回家看看'),
      pick(ORIGIN.next),
      ...from('teahouse'),
    ]);

    // After the second verdict and before the second premise.
    const recalled = view.lines.indexOf(SUMMIT.lastTime.replace(REASON, WHY));
    expect(recalled).toBeGreaterThan(view.lines.indexOf(SUMMIT.premise));
    expect(view.lines.indexOf(SUMMIT.premise, recalled)).toBeGreaterThan(
      recalled,
    );
  });

  it('notices when the reason has not changed', async () => {
    const view = await play(new MemoryStorage(), [
      ...WHOLE_JOURNEY,
      pick(SUMMIT.again),
      ...from('origin'),
    ]);

    expect(view.lines).toContain(SUMMIT.sameAsLast);
  });

  describe('after a reload', () => {
    it.each(RELOADS)(
      'picks up the journey $when',
      async ({played, resumes}) => {
        const whole = await play(new MemoryStorage(), WHOLE_JOURNEY);
        const storage = new MemoryStorage();
        const first = await play(storage, [pick(TITLE.start), ...played]);
        const second = await play(storage, [
          pick(TITLE.resume),
          ...from(resumes),
        ]);

        expect(second.offered[0]).toEqual([
          TITLE.resume,
          TITLE.restart,
          TITLE.forget,
        ]);
        expect(second.waitingOn).toBe(SUMMIT.again);
        expect(second.road).toEqual(whole.road);
        expect(second.rows).toEqual(whole.rows);
        // A station shown again repeats the rumor it showed before.
        expect([...new Set([...first.rumors, ...second.rumors])]).toEqual(
          whole.rumors,
        );
        expect(new SaveStore(storage).loadHistory()).toHaveLength(1);
      },
    );

    it('starts over when the reason was never written', async () => {
      const storage = new MemoryStorage();
      await play(storage, [pick(TITLE.start)]);
      const view = await play(storage, []);

      expect(view.waitingOn).toBe(TITLE.start);
    });

    it('does not offer to resume a finished journey', async () => {
      const storage = new MemoryStorage();
      await play(storage, WHOLE_JOURNEY);
      const view = await play(storage, []);

      expect(view.offered[0]).toEqual([TITLE.start, TITLE.forget]);
    });

    it('can set out afresh instead', async () => {
      const storage = new MemoryStorage();
      await play(storage, [pick(TITLE.start), ...before('inn')]);
      const view = await play(storage, [pick(TITLE.restart)]);

      expect(view.offered[0]).toEqual([
        TITLE.resume,
        TITLE.restart,
        TITLE.forget,
      ]);
      expect(view.waitingOn).toBe(ORIGIN.placeholder);
      expect(view.road).toEqual([]);
      expect(new SaveStore(storage).loadRun()).toBeNull();
    });
  });

  describe('forgetting past journeys', () => {
    /** One finished journey, and a second left at the inn. */
    async function walkedBefore(): Promise<MemoryStorage> {
      const storage = new MemoryStorage();
      await play(storage, [
        ...WHOLE_JOURNEY,
        pick(SUMMIT.again),
        ...before('inn'),
      ]);
      return storage;
    }

    it('forgets every journey once the player confirms', async () => {
      const storage = await walkedBefore();
      const view = await play(storage, [
        pick(TITLE.forget),
        pick(TITLE.forgetConfirm),
      ]);

      expect(view.offered).toEqual([
        [TITLE.resume, TITLE.restart, TITLE.forget],
        [TITLE.forgetConfirm, TITLE.forgetCancel],
        [TITLE.start],
      ]);
      expect(view.lines).toContain(TITLE.forgetWarning);
      expect(view.lines).toContain(TITLE.forgotten);
      const store = new SaveStore(storage);
      expect(store.loadRun()).toBeNull();
      expect(store.loadHistory()).toEqual([]);
    });

    it('keeps everything when the player thinks better of it', async () => {
      const storage = await walkedBefore();
      const view = await play(storage, [
        pick(TITLE.forget),
        pick(TITLE.forgetCancel),
      ]);

      expect(view.offered.at(-1)).toEqual([
        TITLE.resume,
        TITLE.restart,
        TITLE.forget,
      ]);
      expect(view.lines).not.toContain(TITLE.forgotten);
      const store = new SaveStore(storage);
      expect(store.loadRun()).not.toBeNull();
      expect(store.loadHistory()).toHaveLength(1);
    });

    it('is not offered when there is nothing to forget', async () => {
      const view = await play(new MemoryStorage(), []);

      expect(view.offered).toEqual([[TITLE.start]]);
    });
  });
});
