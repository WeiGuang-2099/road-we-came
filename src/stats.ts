import type {Language} from './script';

/**
 * The GoatCounter site that receives the counts: the name in
 * https://name.goatcounter.com. Left empty, nothing is counted.
 */
const GOATCOUNTER_CODE = '';

// A fixed version of GoatCounter's script, checked against its published
// hash. It runs on the same page as the player's words, so the browser must
// refuse anything else that turns up at this address.
const SCRIPT = 'https://gc.zgo.at/count.v5.js';
const SCRIPT_HASH =
  'sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ';

/** What the game tells the visit counter. Never anything the player wrote. */
export interface Stats {
  /** A journey reached the summit. */
  reachedSummit(): void;
}

/** The settings and the one call of GoatCounter's script used here. */
interface GoatCounter {
  allow_frame?: boolean;
  path?: () => string;
  count?: (vars: {path: string; event?: boolean}) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

/**
 * Counts with GoatCounter, which sets no cookies and keeps no personal data:
 * a visit when the game opens, and an event when a journey reaches the
 * summit. Both are named by the site and the language, like
 * weiguang-2099.github.io/en, so GitHub Pages and itch.io show up apart.
 * With no code set, or the script blocked, nothing is counted and the game
 * plays on as before.
 */
export function startStats(language: Language): Stats {
  if (!GOATCOUNTER_CODE) {
    return {reachedSummit() {}};
  }
  const where = `${location.host}/${language}`;
  // The script reads these when it loads.
  window.goatcounter = {
    // itch.io plays the game inside an iframe.
    allow_frame: true,
    // The address would add ?lang=, which the language already says.
    path: () => where,
  };
  const script = document.createElement('script');
  script.async = true;
  script.src = SCRIPT;
  script.integrity = SCRIPT_HASH;
  script.crossOrigin = 'anonymous';
  script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
  document.head.append(script);
  return {
    reachedSummit() {
      window.goatcounter?.count?.({path: `${where}/summit`, event: true});
    },
  };
}
