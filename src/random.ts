/**
 * Seeded random numbers (mulberry32). A run keeps its seed, so the rumors it
 * produced come out the same after a reload.
 */
export class Random {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a number in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [0, max). */
  int(max: number): number {
    return Math.floor(this.next() * max);
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(items.length)];
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}
