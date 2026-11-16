import {isMeaningful} from './chars';
import type {Mark} from './compare';
import {REASON} from './script';

export interface WriteOptions {
  readonly placeholder: string;
  readonly action: string;
  readonly minLength?: number;
  /** Fewest characters that are not punctuation or spaces. */
  readonly minMeaningful?: number;
  readonly maxLength?: number;
}

export interface Written {
  readonly text: string;
  /** The line that replaced the input, showing what was written. */
  readonly node: HTMLElement;
}

export interface ComparisonRow {
  readonly label: string;
  readonly marks: readonly Mark[];
  /** Shown instead when there are no marks. */
  readonly placeholder?: string;
}

const BASE_PAUSE_MS = 450;
const PAUSE_PER_CHAR_MS = 55;
const MAX_PAUSE_MS = 2400;
const SCENE_FADE_MS = 450;
const STROKE_MS = 140;
const SEAL_MS = 700;
// Keep in sync with the dissolve animation in style.css.
const DISSOLVE_HOLD_MS = 700;
const DISSOLVE_MS = 1400;
const DISSOLVE_STAGGER_MS = 80;

/** Draws each scene and collects the player's input. */
export class View {
  private readonly road: HTMLOListElement;
  private readonly scene: HTMLElement;
  private scrollText: HTMLElement | null = null;

  constructor(root: HTMLElement) {
    this.road = element('ol', 'road');
    this.road.setAttribute('aria-label', '走过的地方');
    this.scene = element('section', 'scene');
    this.scene.setAttribute('aria-live', 'polite');
    root.append(this.road, this.scene);
  }

  /** Clears the stage. A named place is also added to the road walked. */
  async enter(place = ''): Promise<void> {
    if (this.scene.childElementCount > 0) {
      this.scene.classList.add('leaving');
      await sleep(motionAllowed() ? SCENE_FADE_MS : 0);
      this.scene.classList.remove('leaving');
    }
    this.scene.replaceChildren();
    this.scene.classList.remove('is-title');
    this.scrollText = null;
    if (place) {
      this.road.querySelector('.here')?.classList.remove('here');
      this.road.append(element('li', 'here', place));
      this.scene.append(element('h2', 'place', place));
    }
  }

  /** Replaces the road walked, e.g. when a saved journey resumes. */
  setRoad(places: readonly string[]): void {
    this.road.replaceChildren(...places.map(place => element('li', '', place)));
  }

  showTitle(name: string, note: string): void {
    this.scene.classList.add('is-title');
    this.scene.append(
      element('h1', 'title', name),
      element('p', 'title-note', note),
    );
  }

  /**
   * Adds a line and waits long enough to read it. A click, Enter or Space
   * moves on sooner. {@link REASON} in `text` is replaced by `reason`.
   */
  async say(text: string, reason?: string): Promise<void> {
    const line = element('p', text.startsWith('「') ? 'line speech' : 'line');
    text.split(REASON).forEach((part, i) => {
      if (i > 0 && reason !== undefined) {
        line.append(element('span', 'reason', reason));
      }
      line.append(part);
    });
    this.reveal(line);
    await waitOrSkip(readingTime(text + (reason ?? '')));
  }

  /** Adds a quiet instruction without holding up the scene. */
  note(text: string): void {
    this.reveal(element('p', 'line note', text));
  }

  async premise(text: string): Promise<void> {
    const line = element('p', 'premise');
    // One span per clause, so a wrapped line breaks after the comma.
    line.append(
      ...text.split(/(?<=，)/).map(clause => element('span', 'clause', clause)),
    );
    this.reveal(line);
    await waitOrSkip(readingTime(text));
  }

  /**
   * Offers `labels` as buttons, and any `quiet` ones on a quieter line below.
   * Resolves with the index picked, the quiet ones counting after `labels`.
   */
  choose(
    labels: readonly string[],
    quiet: readonly string[] = [],
  ): Promise<number> {
    const choice = element('div');
    const group = element('div', 'actions');
    const buttons = labels.map(label => button('action', label));
    group.append(...buttons);
    choice.append(group);
    if (quiet.length > 0) {
      const aside = element('div', 'actions quiet');
      const asides = quiet.map(label => button('action', label));
      aside.append(...asides);
      choice.append(aside);
      buttons.push(...asides);
    }
    // No autofocus: players skipping lines with Enter would pick the first
    // choice by accident.
    this.reveal(choice);

    return new Promise(resolve => {
      choice.addEventListener('click', event => {
        const target = (event.target as Element).closest('button');
        const index = target ? buttons.indexOf(target) : -1;
        if (index < 0 || buttons[index].disabled) {
          return;
        }
        for (const b of buttons) {
          b.disabled = true;
        }
        if (labels.length === 1 || index >= labels.length) {
          choice.remove();
        } else {
          buttons[index].classList.add('picked');
          group.classList.add('chosen');
          group.nextElementSibling?.remove();
        }
        resolve(index);
      });
    });
  }

  async proceed(label: string): Promise<void> {
    await this.choose([label]);
  }

  write(options: WriteOptions): Promise<Written> {
    const {
      placeholder,
      action,
      minLength = 1,
      minMeaningful = 0,
      maxLength = 40,
    } = options;
    const form = element('form', 'write');
    const input = element('textarea', 'write-input');
    input.rows = 1;
    input.maxLength = maxLength;
    input.placeholder = placeholder;
    input.spellcheck = false;
    // Enter submits, so phone keyboards should label the key that way.
    input.enterKeyHint = 'done';
    input.setAttribute('aria-label', placeholder);
    const submit = button('action', action);
    submit.type = 'submit';
    submit.disabled = true;
    const actions = element('div', 'actions');
    actions.append(submit);
    form.append(input, actions);
    this.reveal(form);
    input.focus({preventScroll: true});

    const current = (): string => input.value.replace(/\s+/g, ' ').trim();
    const acceptable = (text: string): boolean => {
      const chars = Array.from(text);
      return (
        chars.length >= minLength &&
        chars.filter(isMeaningful).length >= minMeaningful
      );
    };
    input.addEventListener('input', () => {
      // Grow with the text instead of scrolling inside the box.
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight + input.offsetHeight - input.clientHeight}px`;
      submit.disabled = !acceptable(current());
    });
    input.addEventListener('keydown', event => {
      // While an IME is composing, Enter picks a candidate instead of
      // submitting. Safari still reports keyCode 229 for that press.
      if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) {
        return;
      }
      event.preventDefault();
      form.requestSubmit();
    });

    return new Promise(resolve => {
      form.addEventListener('submit', event => {
        event.preventDefault();
        const text = current();
        if (!acceptable(text)) {
          return;
        }
        const node = element('p', 'words');
        node.append(...Array.from(text, ch => element('span', 'ch', ch)));
        form.replaceWith(node);
        resolve({text, node});
      });
    });
  }

  /** Lets written words thin out into the mist, one character at a time. */
  async dissolve(node: HTMLElement): Promise<void> {
    const chars = node.querySelectorAll<HTMLElement>('.ch');
    chars.forEach((ch, i) => ch.style.setProperty('--i', String(i)));
    node.classList.add('dissolving');
    if (motionAllowed()) {
      await sleep(
        DISSOLVE_HOLD_MS + DISSOLVE_MS + chars.length * DISSOLVE_STAGGER_MS,
      );
    }
    node.classList.add('gone');
  }

  /** Shows `text` as a row of characters; resolves with the index picked. */
  pickChar(text: string, labelFor: (ch: string) => string): Promise<number> {
    const row = element('p', 'fare');
    const choices: HTMLButtonElement[] = [];
    Array.from(text).forEach((ch, index) => {
      if (!isMeaningful(ch)) {
        row.append(element('span', 'ch', ch));
        return;
      }
      const choice = button('ch', ch);
      choice.dataset.index = String(index);
      choice.setAttribute('aria-label', labelFor(ch));
      choices.push(choice);
      row.append(choice);
    });
    this.reveal(row);

    return new Promise(resolve => {
      row.addEventListener('click', event => {
        const target = (event.target as Element).closest('button');
        if (!target || target.disabled) {
          return;
        }
        for (const choice of choices) {
          choice.disabled = true;
        }
        target.classList.add('taken');
        resolve(Number(target.dataset.index));
      });
    });
  }

  /** Unrolls a blank scroll. {@link inscribe} writes on it later. */
  showScroll(seal: string): void {
    const figure = element('figure', 'scroll');
    const paper = element('div', 'scroll-paper');
    const writing = element('p', 'scroll-text');
    const stamp = element('span', 'seal', seal);
    stamp.setAttribute('aria-hidden', 'true');
    paper.append(writing, stamp);
    figure.append(paper);
    this.reveal(figure);
    this.scrollText = writing;
  }

  async inscribe(text: string): Promise<void> {
    const writing = this.scrollText;
    if (!writing) {
      return;
    }
    writing.append(element('span', 'visually-hidden', text));
    // Every character takes its place before any is inked, so the scroll
    // settles on its final size at once instead of shifting sideways each
    // time a new column starts.
    const strokes = Array.from(text, ch => {
      const stroke = element('span', 'stroke pending', ch);
      stroke.setAttribute('aria-hidden', 'true');
      return stroke;
    });
    writing.append(...strokes);
    fitColumns(writing);
    writing.scrollIntoView({block: 'center', behavior: scrollBehavior()});
    for (const stroke of strokes) {
      stroke.classList.remove('pending');
      if (motionAllowed()) {
        await sleep(STROKE_MS);
      }
    }
    writing.parentElement?.classList.add('sealed');
    await sleep(motionAllowed() ? SEAL_MS : 0);
  }

  showComparison(rows: readonly ComparisonRow[]): void {
    const list = element('dl', 'compare');
    for (const row of rows) {
      const text = element('dd');
      for (const mark of row.marks) {
        text.append(element('span', mark.kind, mark.ch));
      }
      if (row.marks.length === 0 && row.placeholder) {
        text.append(element('span', 'none', row.placeholder));
      }
      const item = element('div');
      item.append(element('dt', '', row.label), text);
      list.append(item);
    }
    this.reveal(list);
  }

  private reveal(node: HTMLElement): void {
    this.scene.append(node);
    node.scrollIntoView({block: 'nearest', behavior: scrollBehavior()});
  }
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

function button(className: string, label: string): HTMLButtonElement {
  const node = element('button', className, label);
  node.type = 'button';
  return node;
}

/**
 * Columns of vertical writing add up sideways. When they would run wider than
 * the room the scroll has, the scroll grows taller instead, so each column
 * holds more characters.
 */
function fitColumns(writing: HTMLElement): void {
  const paper = writing.parentElement;
  const room = paper?.parentElement;
  if (!paper || !room) {
    return;
  }
  const step = parseFloat(getComputedStyle(writing).fontSize);
  let height = paper.offsetHeight;
  while (paper.offsetWidth > room.clientWidth && height < window.innerHeight) {
    height += step;
    paper.style.height = `${height}px`;
  }
}

function readingTime(text: string): number {
  const length = Array.from(text).length;
  return Math.min(BASE_PAUSE_MS + length * PAUSE_PER_CHAR_MS, MAX_PAUSE_MS);
}

function motionAllowed(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollBehavior(): ScrollBehavior {
  return motionAllowed() ? 'smooth' : 'auto';
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Waits `ms`, or less if the player clicks or presses Enter or Space. */
function waitOrSkip(ms: number): Promise<void> {
  return new Promise(resolve => {
    const finish = (): void => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
      resolve();
    };
    const onPointer = (event: PointerEvent): void => {
      if (!isControl(event.target)) {
        finish();
      }
    };
    const onKey = (event: KeyboardEvent): void => {
      if (
        (event.key === 'Enter' || event.key === ' ') &&
        !isControl(event.target)
      ) {
        event.preventDefault();
        finish();
      }
    };
    const timer = setTimeout(finish, ms);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
  });
}

function isControl(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('button, textarea, input, a') !== null
  );
}
