import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {type Part, wordCount} from './chars';
import {Game, type GameView} from './game';
import {MemoryStorage} from './memory_storage';
import {SaveStore} from './save';
import {
  REASON,
  type Script,
  type Station,
  type StationId,
  type Visit,
} from './script';
import {EN} from './script_en';
import {ZH} from './script_zh';
import type {Stats} from './stats';
import type {ComparisonRow, WriteOptions, Written} from './view';

const {
  title: TITLE,
  next: NEXT,
  origin: ORIGIN,
  replies: REPLIES,
  summit: SUMMIT,
  verdicts: VERDICTS,
} = ZH;

const STATION_IDS: readonly StationId[] = ['teahouse', 'inn', 'bridge'];

/** Every place on the road, in order, as `script` names them. */
function placesIn(script: Script): string[] {
  return [
    ...STATION_IDS.map(id => script.stations[id].place),
    script.ferry.place,
    script.gate.place,
    script.summit.place,
  ];
}

/** Every visit a station can be heard on, the first one first. */
function visitsTo(station: Station): Visit[] {
  return [station.first, ...station.later];
}

const RUMORS = new Set(
  [ZH, EN].flatMap(script =>
    STATION_IDS.flatMap(id =>
      visitsTo(script.stations[id]).map(visit => visit.rumor),
    ),
  ),
);

/** One thing the player does: click a button, write a line, or pay a word. */
type Answer =
  {readonly pick: string} | {readonly write: string} | {readonly give: string};

const pick = (label: string): Answer => ({pick: label});
const write = (text: string): Answer => ({write: text});
const give = (word: string): Answer => ({give: word});

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
    if (reason !== undefined && RUMORS.has(text)) {
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

  /** Takes a written line only if it has as many words as the page asks. */
  write(options: WriteOptions): Promise<Written> {
    const fewest = options.minWords?.count ?? 0;
    return this.answer(options.placeholder, answer =>
      'write' in answer && wordCount(answer.write) >= fewest
        ? {text: answer.write, node: LINE}
        : undefined,
    );
  }

  dissolve(): Promise<void> {
    return Promise.resolve();
  }

  pickPart(parts: readonly Part[]): Promise<number> {
    return this.answer(parts.map(part => part.text).join(''), answer =>
      'give' in answer
        ? found(parts.findIndex(part => part.word && part.text === answer.give))
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
      row =>
        row.marks.map(mark => mark.text).join('') || (row.placeholder ?? ''),
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

/** Counts the journeys the game reports, as the visit counter would. */
class CountingStats implements Stats {
  summits = 0;

  reachedSummit(): void {
    this.summits += 1;
  }
}

/** Opens the game on `storage` and plays `answers` until they run out. */
async function play(
  storage: Storage,
  answers: readonly Answer[],
  script: Script = ZH,
  stats: Stats = new CountingStats(),
): Promise<ScriptedView> {
  const view = new ScriptedView(answers);
  void new Game(
    view,
    new SaveStore(storage),
    {start() {}},
    script,
    stats,
  ).start();
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
const PLACES = placesIn(ZH);

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
    expect(view.rumors).toHaveLength(STATION_IDS.length);
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

  it('needs two words before setting out', async () => {
    for (const [script, one, two] of [
      [ZH, '海', '看海'],
      [EN, 'sea', 'the sea'],
    ] as const) {
      const start = pick(script.title.start);
      await expect(
        play(new MemoryStorage(), [start, write(one)], script),
      ).rejects.toThrow(`Stuck at "${script.origin.placeholder}"`);
      const view = await play(new MemoryStorage(), [start, write(two)], script);
      expect(view.waitingOn).toBe(script.origin.next);
    }
  });

  it('needs a word, not just punctuation, to retell the reason', async () => {
    await expect(
      play(new MemoryStorage(), [
        pick(TITLE.start),
        ...before('teahouse'),
        pick(REPLIES.deny),
        write('。'),
      ]),
    ).rejects.toThrow(`Stuck at "${REPLIES.placeholder}"`);
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

  it('tells the visit counter once a journey reaches the summit', async () => {
    const storage = new MemoryStorage();
    const stats = new CountingStats();
    await play(storage, [pick(TITLE.start), ...before('summit')], ZH, stats);
    expect(stats.summits).toBe(0);

    // A reload before writing at the summit resumes there; one at the end
    // starts a new journey instead of counting this one again.
    await play(storage, [pick(TITLE.resume), ...from('summit')], ZH, stats);
    await play(storage, [], ZH, stats);
    expect(stats.summits).toBe(1);
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

  describe('on later journeys', () => {
    const {teahouse, inn, bridge} = ZH.stations;

    it('greets a returning player with other lines at every station', async () => {
      const view = await play(new MemoryStorage(), [
        ...WHOLE_JOURNEY,
        pick(SUMMIT.again),
        ...from('origin'),
      ]);

      // The second journey answers as the first did: it accepts at the
      // teahouse and retells the reason at the inn and the bridge.
      const [atTeahouse, atInn, atBridge] = view.rumors.slice(
        STATION_IDS.length,
      );
      expect(view.lines).toEqual(
        expect.arrayContaining([
          ...teahouse.later[0].intro,
          teahouse.later[0].rumor.replace(REASON, atTeahouse),
          teahouse.later[0].accepted,
          ...inn.later[0].intro,
          inn.later[0].rumor.replace(REASON, atInn),
          inn.later[0].askAgain,
          inn.later[0].corrected,
          ...bridge.later[0].intro,
          bridge.later[0].rumor.replace(REASON, atBridge),
          bridge.later[0].askAgain,
          bridge.later[0].corrected,
        ]),
      );
      for (const station of [teahouse, inn, bridge]) {
        const opening = station.first.intro[0];
        expect(view.lines.filter(line => line === opening)).toHaveLength(1);
      }
    });

    it('takes turns with the later lines, then starts over', async () => {
      const journeys = teahouse.later.length + 2;
      const view = await play(new MemoryStorage(), [
        ...WHOLE_JOURNEY,
        ...Array.from({length: journeys - 1}, () => [
          pick(SUMMIT.again),
          ...from('origin'),
        ]).flat(),
      ]);

      const openings = visitsTo(teahouse).map(visit => visit.intro[0]);
      const heard = view.lines
        .filter(line => openings.includes(line))
        .map(line => openings.indexOf(line));
      // The first visit, then each later one in turn, then the turns again.
      expect(heard).toEqual([0, ...teahouse.later.map((_, i) => i + 1), 1]);
    });

    it('meets the player afresh once the past is forgotten', async () => {
      const storage = new MemoryStorage();
      await play(storage, WHOLE_JOURNEY);
      const view = await play(storage, [
        pick(TITLE.forget),
        pick(TITLE.forgetConfirm),
        pick(TITLE.start),
        ...before('inn'),
      ]);

      expect(view.lines).toEqual(
        expect.arrayContaining([...teahouse.first.intro]),
      );
      expect(view.lines).not.toContain(teahouse.later[0].intro[0]);
    });

    it('keeps its lines when a later journey is reloaded', async () => {
      const storage = new MemoryStorage();
      await play(storage, [
        ...WHOLE_JOURNEY,
        pick(SUMMIT.again),
        ...before('inn'),
      ]);
      const view = await play(storage, [pick(TITLE.resume), ...from('inn')]);

      expect(view.lines).toEqual(
        expect.arrayContaining([...inn.later[0].intro]),
      );
      expect(view.lines).not.toContain(inn.first.intro[0]);
    });
  });

  describe('in English', () => {
    const REASON_EN = 'I want to see the sea before I turn thirty';

    it('walks the whole road, paying the ferryman a whole word', async () => {
      const view = await play(
        new MemoryStorage(),
        [
          pick(EN.title.start),
          write(REASON_EN),
          pick(EN.origin.next),
          pick(EN.replies.accept),
          pick(EN.next),
          pick(EN.replies.deny),
          write(REASON_EN),
          pick(EN.next),
          pick(EN.replies.deny),
          write(REASON_EN),
          pick(EN.next),
          give('sea'),
          pick(EN.next),
          pick(EN.next),
          write('I want to see the sea'),
        ],
        EN,
      );

      expect(view.waitingOn).toBe(EN.summit.again);
      expect(view.road).toEqual(placesIn(EN));
      expect(view.rows).toEqual([
        REASON_EN,
        'I want to see the before I turn thirty',
        'I want to see the sea',
      ]);
      // Six of the ten words, all of them the player's own.
      expect(view.lines).toContain(EN.verdicts.mostly);
      // Nothing the player reads is left in Chinese.
      expect(view.lines.join('\n')).not.toMatch(/\p{Script=Han}/u);
    });
  });
});
