// Every GitHub Pages project site under one account shares an origin, and so
// shares localStorage. All keys carry this prefix to stay out of each other's
// way.
const PREFIX = 'laishilu:v1:';
const RUN_KEY = `${PREFIX}run`;
const HISTORY_KEY = `${PREFIX}history`;
const MUTED_KEY = `${PREFIX}muted`;
const PROBE_KEY = `${PREFIX}probe`;

/** A journey in progress. */
export interface Run {
  version: 1;
  seed: number;
  /** Index of the next stage to play. */
  stage: number;
  /** The reason as the player first wrote it. */
  origin: string;
  /** The reason as it is currently being passed along the road. */
  carried: string;
  /** The retelling waiting at the current station, kept so a reload repeats it. */
  rumor?: string;
  startedAt: number;
}

export interface Journey {
  readonly origin: string;
  readonly carried: string;
  readonly recall: string;
  readonly score: number;
  readonly endedAt: number;
}

/**
 * Saves progress to localStorage. Any storage failure is swallowed: the game
 * stays playable, it just stops remembering.
 */
export class SaveStore {
  private readonly storage: Storage | null;

  constructor(storage: Storage | null) {
    this.storage = storage;
  }

  loadRun(): Run | null {
    const value = this.read(RUN_KEY);
    return isRun(value) ? value : null;
  }

  saveRun(run: Run): void {
    this.write(RUN_KEY, run);
  }

  clearRun(): void {
    try {
      this.storage?.removeItem(RUN_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }

  loadHistory(): Journey[] {
    const value = this.read(HISTORY_KEY);
    return Array.isArray(value) ? value.filter(isJourney) : [];
  }

  /** Records a finished journey and returns how many have been finished. */
  addJourney(journey: Journey): number {
    const history = this.loadHistory();
    history.push(journey);
    this.write(HISTORY_KEY, history);
    return history.length;
  }

  isMuted(): boolean {
    return this.read(MUTED_KEY) === true;
  }

  setMuted(muted: boolean): void {
    this.write(MUTED_KEY, muted);
  }

  private read(key: string): unknown {
    try {
      const raw = this.storage?.getItem(key);
      return raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: unknown): void {
    try {
      this.storage?.setItem(key, JSON.stringify(value));
    } catch {
      // Full or blocked storage: keep playing without saving.
    }
  }
}

/** Returns localStorage if it can actually be written to. */
export function browserStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

function isRun(value: unknown): value is Run {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const run = value as Partial<Run>;
  return (
    run.version === 1 &&
    typeof run.seed === 'number' &&
    typeof run.stage === 'number' &&
    typeof run.origin === 'string' &&
    typeof run.carried === 'string' &&
    (run.rumor === undefined || typeof run.rumor === 'string')
  );
}

function isJourney(value: unknown): value is Journey {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const journey = value as Partial<Journey>;
  return (
    typeof journey.origin === 'string' &&
    typeof journey.recall === 'string' &&
    typeof journey.score === 'number'
  );
}
