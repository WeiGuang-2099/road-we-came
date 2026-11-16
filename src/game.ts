import type {Ambience} from './ambience';
import {type Part, hasWords, partsOf, withoutPart} from './chars';
import {align, judge, similarity} from './compare';
import {drift} from './drift';
import {Random, randomSeed} from './random';
import type {Run, SaveStore} from './save';
import type {Script, Station, StationId, Visit} from './script';
import type {ComparisonRow, WriteOptions, Written} from './view';

/** The stations, in the order the road reaches them. */
const STATIONS: readonly StationId[] = ['teahouse', 'inn', 'bridge'];

/** How many small changes the reason picks up on its way to each station. */
const DRIFT_STEPS: Readonly<Record<StationId, number>> = {
  teahouse: 1,
  inn: 2,
  bridge: 2,
};

type StageId = 'origin' | StationId | 'ferry' | 'gate' | 'summit';

const STAGES: readonly StageId[] = [
  'origin',
  ...STATIONS,
  'ferry',
  'gate',
  'summit',
];

/**
 * What the game needs from the page. View draws it in the browser; the tests
 * play through a scripted stand-in.
 */
export interface GameView {
  enter(place?: string): Promise<void>;
  setRoad(places: readonly string[]): void;
  showTitle(name: string, note: string): void;
  say(text: string, reason?: string): Promise<void>;
  note(text: string): void;
  premise(text: string): Promise<void>;
  choose(labels: readonly string[], quiet?: readonly string[]): Promise<number>;
  proceed(label: string): Promise<void>;
  write(options: WriteOptions): Promise<Written>;
  dissolve(node: HTMLElement): Promise<void>;
  pickPart(
    parts: readonly Part[],
    labelFor: (word: string) => string,
  ): Promise<number>;
  showScroll(seal: string): void;
  inscribe(text: string): Promise<void>;
  showComparison(rows: readonly ComparisonRow[]): void;
}

/**
 * Plays the journey from the title screen to the summit, and again, in the
 * language of the script it is given.
 *
 * Each stage calls {@link Game.advance} once its choice is final. Progress is
 * saved there, so a reload resumes at the first stage not yet settled.
 */
export class Game {
  private readonly view: GameView;
  private readonly store: SaveStore;
  private readonly ambience: Pick<Ambience, 'start'>;
  private readonly script: Script;

  constructor(
    view: GameView,
    store: SaveStore,
    ambience: Pick<Ambience, 'start'>,
    script: Script,
  ) {
    this.view = view;
    this.store = store;
    this.ambience = ambience;
    this.script = script;
  }

  async start(): Promise<void> {
    let run = await this.titleScreen();
    for (;;) {
      while (run.stage < STAGES.length) {
        await this.play(STAGES[run.stage], run);
      }
      run = newRun();
      this.view.setRoad([]);
    }
  }

  private async titleScreen(): Promise<Run> {
    const {title} = this.script;
    let note = title.note;
    for (;;) {
      await this.view.enter();
      this.view.showTitle(title.name, note);
      const saved = this.resumableRun();
      const options = saved ? [title.resume, title.restart] : [title.start];
      const hasPast = saved !== null || this.store.loadHistory().length > 0;
      const choice = await this.view.choose(
        options,
        hasPast ? [title.forget] : [],
      );
      if (choice === options.length) {
        if (await this.confirmForget()) {
          this.store.forget();
          note = title.forgotten;
        }
        continue;
      }
      this.ambience.start();
      if (saved && choice === 0) {
        this.view.setRoad(
          STAGES.slice(0, saved.stage)
            .map(stage => this.placeOf(stage))
            .filter(Boolean),
        );
        return saved;
      }
      this.store.clearRun();
      return newRun();
    }
  }

  /** Asks before every journey is forgotten; true if the player agrees. */
  private async confirmForget(): Promise<boolean> {
    const {title} = this.script;
    await this.view.say(title.forgetWarning);
    const choice = await this.view.choose([
      title.forgetConfirm,
      title.forgetCancel,
    ]);
    return choice === 0;
  }

  private resumableRun(): Run | null {
    const run = this.store.loadRun();
    return run && run.stage > 0 && run.stage < STAGES.length ? run : null;
  }

  private play(stage: StageId, run: Run): Promise<void> {
    switch (stage) {
      case 'origin':
        return this.origin(run);
      case 'ferry':
        return this.ferry(run);
      case 'gate':
        return this.gate(run);
      case 'summit':
        return this.summit(run);
      default:
        return this.station(run, stage);
    }
  }

  private advance(run: Run): void {
    run.stage += 1;
    this.store.saveRun(run);
  }

  private async origin(run: Run): Promise<void> {
    const {origin} = this.script;
    await this.view.enter();
    await this.view.say(origin.prompt);
    this.view.note(origin.hint);
    const {text, node} = await this.view.write({
      placeholder: origin.placeholder,
      action: origin.action,
      minMeaningful: 2,
      maxLength: this.script.maxLength,
    });
    run.origin = text;
    run.carried = text;
    this.advance(run);
    await this.view.dissolve(node);
    await this.view.say(origin.handover);
    await this.view.proceed(origin.next);
  }

  private async station(run: Run, id: StationId): Promise<void> {
    const {replies} = this.script;
    const station = this.script.stations[id];
    // History only grows at the summit, so a reload hears the same lines.
    const visit = visitOn(station, this.store.loadHistory().length);
    await this.view.enter(station.place);
    for (const line of visit.intro) {
      await this.view.say(line);
    }
    if (run.rumor === undefined) {
      run.rumor = drift(run.carried, DRIFT_STEPS[id], this.randomFor(run));
      this.store.saveRun(run);
    }
    await this.view.say(visit.rumor, run.rumor);

    const denied =
      (await this.view.choose([replies.accept, replies.deny])) === 1;
    if (denied) {
      await this.view.say(visit.askAgain);
      const {text} = await this.view.write({
        placeholder: replies.placeholder,
        action: station.tell,
        maxLength: this.script.maxLength,
      });
      run.carried = text;
    } else {
      run.carried = run.rumor;
    }
    run.rumor = undefined;
    this.advance(run);
    await this.view.say(denied ? visit.corrected : visit.accepted);
    await this.view.proceed(this.script.next);
  }

  private async ferry(run: Run): Promise<void> {
    const {ferry} = this.script;
    await this.view.enter(ferry.place);
    for (const line of ferry.intro) {
      await this.view.say(line);
    }
    // The fare is one word: a whole word, or one character of Chinese.
    const parts = partsOf(run.carried);
    if (parts.some(part => part.word)) {
      this.view.note(ferry.instruction);
      const index = await this.view.pickPart(parts, ferry.giveLabel);
      run.carried = withoutPart(run.carried, index);
      this.advance(run);
      await this.view.say(ferry.taken);
    } else {
      this.advance(run);
      await this.view.say(ferry.waived);
    }
    await this.view.say(ferry.landed);
    await this.view.proceed(this.script.next);
  }

  private async gate(run: Run): Promise<void> {
    const {gate} = this.script;
    await this.view.enter(gate.place);
    this.advance(run);
    for (const line of gate.lines) {
      await this.view.say(line);
    }
    await this.view.proceed(this.script.next);
  }

  private async summit(run: Run): Promise<void> {
    const {summit, verdicts} = this.script;
    await this.view.enter(summit.place);
    for (const line of summit.arrival) {
      await this.view.say(line);
    }
    this.view.showScroll(summit.seal);
    for (const line of summit.request) {
      await this.view.say(line);
    }
    const {text: recall, node} = await this.view.write({
      placeholder: summit.placeholder,
      action: summit.action,
      maxLength: this.script.maxLength,
    });
    node.remove();

    const previous = this.store.loadHistory().at(-1);
    const journeys = this.store.addJourney({
      origin: run.origin,
      carried: run.carried,
      recall,
      score: similarity(run.origin, recall),
      endedAt: Date.now(),
    });
    this.store.clearRun();
    run.stage = STAGES.length;

    await this.view.inscribe(recall);
    const remembered = align(run.origin, recall);
    this.view.showComparison([
      {label: summit.originLabel, marks: remembered.before},
      {
        label: summit.carriedLabel,
        // The ferry can take the last word a short reason had left.
        marks: hasWords(run.carried)
          ? align(run.origin, run.carried).after
          : [],
        placeholder: summit.nothingCarried,
      },
      {label: summit.recallLabel, marks: remembered.after},
    ]);
    this.view.note(summit.legend);
    await this.view.say(verdicts[judge(run.origin, run.carried, recall)]);
    if (previous) {
      if (similarity(previous.origin, run.origin) === 1) {
        await this.view.say(summit.sameAsLast);
      } else {
        await this.view.say(summit.lastTime, previous.origin);
      }
    }
    await this.view.premise(summit.premise);
    if (journeys > 1) {
      this.view.note(summit.count(journeys));
    }
    await this.view.proceed(summit.again);
  }

  private placeOf(stage: StageId): string {
    switch (stage) {
      case 'origin':
        return '';
      case 'ferry':
        return this.script.ferry.place;
      case 'gate':
        return this.script.gate.place;
      case 'summit':
        return this.script.summit.place;
      default:
        return this.script.stations[stage].place;
    }
  }

  private randomFor(run: Run): Random {
    return new Random(run.seed + run.stage * 0x9e3779b1);
  }
}

/**
 * What `station` says on a journey that begins after `finished` others have
 * reached the summit. The first journey hears the first visit; later ones
 * take turns with the rest. Forgetting the past starts the count over.
 */
function visitOn(station: Station, finished: number): Visit {
  return finished === 0
    ? station.first
    : station.later[(finished - 1) % station.later.length];
}

function newRun(): Run {
  return {
    version: 1,
    seed: randomSeed(),
    stage: 0,
    origin: '',
    carried: '',
    startedAt: Date.now(),
  };
}
