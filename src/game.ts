import type {Ambience} from './ambience';
import {hasMeaningfulChars, removeCharAt} from './chars';
import {align, judge, similarity} from './compare';
import {drift} from './drift';
import {Random, randomSeed} from './random';
import type {Run, SaveStore} from './save';
import {
  FERRY,
  GATE,
  NEXT,
  ORIGIN,
  REPLIES,
  STATIONS,
  SUMMIT,
  TITLE,
  VERDICTS,
  type Station,
} from './script';
import type {View} from './view';

type StageId = 'origin' | Station['id'] | 'ferry' | 'gate' | 'summit';

const STAGES: readonly StageId[] = [
  'origin',
  ...STATIONS.map(station => station.id),
  'ferry',
  'gate',
  'summit',
];

/**
 * Plays the journey from the title screen to the summit, and again.
 *
 * Each stage calls {@link Game.advance} once its choice is final. Progress is
 * saved there, so a reload resumes at the first stage not yet settled.
 */
export class Game {
  private readonly view: View;
  private readonly store: SaveStore;
  private readonly ambience: Ambience;

  constructor(view: View, store: SaveStore, ambience: Ambience) {
    this.view = view;
    this.store = store;
    this.ambience = ambience;
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
    await this.view.enter();
    this.view.showTitle(TITLE.name, TITLE.note);
    const saved = this.resumableRun();
    const choice = await this.view.choose(
      saved ? [TITLE.resume, TITLE.restart] : [TITLE.start],
    );
    this.ambience.start();
    if (saved && choice === 0) {
      this.view.setRoad(
        STAGES.slice(0, saved.stage).map(placeOf).filter(Boolean),
      );
      return saved;
    }
    this.store.clearRun();
    return newRun();
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
        return this.station(run, stationFor(stage));
    }
  }

  private advance(run: Run): void {
    run.stage += 1;
    this.store.saveRun(run);
  }

  private async origin(run: Run): Promise<void> {
    await this.view.enter();
    await this.view.say(ORIGIN.prompt);
    this.view.note(ORIGIN.hint);
    const {text, node} = await this.view.write({
      placeholder: ORIGIN.placeholder,
      action: ORIGIN.action,
      minMeaningful: 2,
    });
    run.origin = text;
    run.carried = text;
    this.advance(run);
    await this.view.dissolve(node);
    await this.view.say(ORIGIN.handover);
    await this.view.proceed(ORIGIN.next);
  }

  private async station(run: Run, station: Station): Promise<void> {
    await this.view.enter(station.place);
    for (const line of station.intro) {
      await this.view.say(line);
    }
    if (run.rumor === undefined) {
      run.rumor = drift(run.carried, station.driftSteps, this.randomFor(run));
      this.store.saveRun(run);
    }
    await this.view.say(station.rumor, run.rumor);

    const denied =
      (await this.view.choose([REPLIES.accept, REPLIES.deny])) === 1;
    if (denied) {
      await this.view.say(station.askAgain);
      const {text} = await this.view.write({
        placeholder: REPLIES.placeholder,
        action: station.tell,
      });
      run.carried = text;
    } else {
      run.carried = run.rumor;
    }
    run.rumor = undefined;
    this.advance(run);
    await this.view.say(denied ? station.corrected : station.accepted);
    await this.view.proceed(NEXT);
  }

  private async ferry(run: Run): Promise<void> {
    await this.view.enter(FERRY.place);
    for (const line of FERRY.intro) {
      await this.view.say(line);
    }
    if (hasMeaningfulChars(run.carried)) {
      this.view.note(FERRY.instruction);
      const index = await this.view.pickChar(run.carried, FERRY.giveLabel);
      run.carried = removeCharAt(run.carried, index);
      this.advance(run);
      await this.view.say(FERRY.taken);
    } else {
      this.advance(run);
      await this.view.say(FERRY.waived);
    }
    await this.view.say(FERRY.landed);
    await this.view.proceed(NEXT);
  }

  private async gate(run: Run): Promise<void> {
    await this.view.enter(GATE.place);
    this.advance(run);
    for (const line of GATE.lines) {
      await this.view.say(line);
    }
    await this.view.proceed(NEXT);
  }

  private async summit(run: Run): Promise<void> {
    await this.view.enter(SUMMIT.place);
    for (const line of SUMMIT.arrival) {
      await this.view.say(line);
    }
    this.view.showScroll(TITLE.name);
    for (const line of SUMMIT.request) {
      await this.view.say(line);
    }
    const {text: recall, node} = await this.view.write({
      placeholder: SUMMIT.placeholder,
      action: SUMMIT.action,
    });
    node.remove();

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
      {label: SUMMIT.originLabel, marks: remembered.before},
      {
        label: SUMMIT.carriedLabel,
        // The ferry can take the last character a short reason had left.
        marks: hasMeaningfulChars(run.carried)
          ? align(run.origin, run.carried).after
          : [],
        placeholder: SUMMIT.nothingCarried,
      },
      {label: SUMMIT.recallLabel, marks: remembered.after},
    ]);
    this.view.note(SUMMIT.legend);
    await this.view.say(VERDICTS[judge(run.origin, run.carried, recall)]);
    await this.view.premise(SUMMIT.premise);
    if (journeys > 1) {
      this.view.note(SUMMIT.count(journeys));
    }
    await this.view.proceed(SUMMIT.again);
  }

  private randomFor(run: Run): Random {
    return new Random(run.seed + run.stage * 0x9e3779b1);
  }
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

function stationFor(id: Station['id']): Station {
  const station = STATIONS.find(s => s.id === id);
  if (!station) {
    throw new Error(`Unknown station: ${id}`);
  }
  return station;
}

function placeOf(stage: StageId): string {
  switch (stage) {
    case 'origin':
      return '';
    case 'ferry':
      return FERRY.place;
    case 'gate':
      return GATE.place;
    case 'summit':
      return SUMMIT.place;
    default:
      return stationFor(stage).place;
  }
}
