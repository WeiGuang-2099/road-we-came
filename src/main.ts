// LXGW WenKai, split by unicode-range so a page only fetches the characters
// it shows. It gives every device the same Kai, phones included.
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import './style.css';

import {Ambience} from './ambience';
import {Game} from './game';
import {SaveStore, browserStorage} from './save';
import {SOUND} from './script';
import {View} from './view';

function mountSoundToggle(ambience: Ambience, store: SaveStore): void {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sound';
  const render = (): void => {
    toggle.textContent = ambience.isMuted() ? SOUND.unmute : SOUND.mute;
  };
  toggle.addEventListener('click', () => {
    ambience.setMuted(!ambience.isMuted());
    store.setMuted(ambience.isMuted());
    ambience.start();
    render();
  });
  render();
  document.body.append(toggle);
}

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Missing #app element.');
}
const store = new SaveStore(browserStorage());
const ambience = new Ambience(store.isMuted());
mountSoundToggle(ambience, store);
void new Game(new View(root), store, ambience).start();
