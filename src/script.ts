// The shape all player-facing text takes. The text itself lives in
// script_zh.ts and script_en.ts; game.ts only decides the order.

import type {Verdict} from './compare';

export type Language = 'zh' | 'en';

export function isLanguage(value: unknown): value is Language {
  return value === 'zh' || value === 'en';
}

/** Where the player's reason is quoted inside a line. */
export const REASON = '{reason}';

export type StationId = 'teahouse' | 'inn' | 'bridge';

export interface Station {
  readonly place: string;
  readonly intro: readonly string[];
  /** What people on the road say the reason was. Contains {@link REASON}. */
  readonly rumor: string;
  readonly accepted: string;
  readonly askAgain: string;
  /** Button that hands over the corrected reason. */
  readonly tell: string;
  readonly corrected: string;
}

/**
 * Everything the player reads, in one language. Lines that open with a
 * quotation mark are spoken, and styled as speech.
 */
export interface Script {
  /** The page language, for the lang attribute. */
  readonly lang: string;
  /** This language's name in itself, shown on the switch that leads to it. */
  readonly languageName: string;
  /** How many characters a written line may hold. */
  readonly maxLength: number;
  readonly title: {
    readonly name: string;
    readonly note: string;
    readonly start: string;
    readonly resume: string;
    readonly restart: string;
    readonly forget: string;
    readonly forgetWarning: string;
    readonly forgetConfirm: string;
    readonly forgetCancel: string;
    readonly forgotten: string;
  };
  readonly next: string;
  readonly sound: {readonly mute: string; readonly unmute: string};
  /** Names the list of places already passed, for screen readers. */
  readonly road: string;
  readonly origin: {
    readonly prompt: string;
    readonly hint: string;
    readonly placeholder: string;
    readonly action: string;
    readonly handover: string;
    readonly next: string;
  };
  readonly replies: {
    readonly accept: string;
    readonly deny: string;
    readonly placeholder: string;
  };
  readonly stations: Readonly<Record<StationId, Station>>;
  readonly ferry: {
    readonly place: string;
    readonly intro: readonly string[];
    readonly instruction: string;
    /** Labels the button that hands `word` to the ferryman. */
    readonly giveLabel: (word: string) => string;
    readonly taken: string;
    readonly waived: string;
    readonly landed: string;
  };
  readonly gate: {readonly place: string; readonly lines: readonly string[]};
  readonly summit: {
    readonly place: string;
    readonly arrival: readonly string[];
    readonly request: readonly string[];
    readonly placeholder: string;
    readonly action: string;
    /** Pressed on the scroll once it is written. */
    readonly seal: string;
    readonly originLabel: string;
    readonly carriedLabel: string;
    readonly nothingCarried: string;
    readonly recallLabel: string;
    readonly legend: string;
    /** What the player wrote the time before. Contains {@link REASON}. */
    readonly lastTime: string;
    readonly sameAsLast: string;
    readonly premise: string;
    readonly count: (journeys: number) => string;
    readonly again: string;
  };
  readonly verdicts: Readonly<Record<Verdict, string>>;
}
