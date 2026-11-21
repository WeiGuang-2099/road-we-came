// LXGW WenKai, split by unicode-range so a page only fetches the characters
// it shows. It gives every device the same Kai, phones included.
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import './style.css';

import {Ambience} from './ambience';
import {Game} from './game';
import {SCRIPTS, otherLanguage, pickLanguage} from './language';
import {SaveStore, browserStorage} from './save';
import type {Language, Script} from './script';
import {startStats} from './stats';
import {View} from './view';

/** The language switch and the sound toggle, kept in a corner. */
function mountControls(
  language: Language,
  script: Script,
  ambience: Ambience,
  store: SaveStore,
): void {
  const other = SCRIPTS[otherLanguage(language)];
  const switcher = button(other.languageName);
  switcher.lang = other.lang;
  switcher.addEventListener('click', () => {
    store.setLanguage(otherLanguage(language));
    // The address carries the choice too, in case storage is unavailable.
    const url = new URL(location.href);
    url.searchParams.set('lang', otherLanguage(language));
    location.assign(url);
  });

  const sound = button('');
  const render = (): void => {
    sound.textContent = ambience.isMuted()
      ? script.sound.unmute
      : script.sound.mute;
  };
  sound.addEventListener('click', () => {
    ambience.setMuted(!ambience.isMuted());
    store.setMuted(ambience.isMuted());
    ambience.start();
    render();
  });
  render();

  const controls = document.createElement('div');
  controls.className = 'controls';
  controls.append(switcher, sound);
  document.body.append(controls);
}

function button(label: string): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = label;
  return node;
}

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Missing #app element.');
}
const store = new SaveStore(browserStorage());
const language = pickLanguage(
  location.search,
  store.language(),
  navigator.languages,
);
const script = SCRIPTS[language];
document.documentElement.lang = script.lang;
document.title = script.title.name;

const ambience = new Ambience(store.isMuted());
mountControls(language, script, ambience, store);
const stats = startStats(language);
void new Game(
  new View(root, script.road),
  store,
  ambience,
  script,
  stats,
).start();
