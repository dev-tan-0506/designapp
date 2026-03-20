import { describe, expect, it } from 'vitest';

import { HistoryManager } from './history-manager';

describe('HistoryManager', () => {
  it('caps history at 100 entries', () => {
    const history = new HistoryManager<number>();

    for (let index = 0; index < 150; index += 1) {
      history.push(index);
    }

    expect(history.size()).toBe(100);
  });

  it('returns previous snapshots through undo and redo', () => {
    const history = new HistoryManager<number>();

    history.push(1);
    history.push(2);

    expect(history.undo(3)).toBe(2);
    expect(history.redo(2)).toBe(3);
  });

  it('clears redo history after a fresh push', () => {
    const history = new HistoryManager<number>();

    history.push(1);
    history.push(2);

    expect(history.undo(3)).toBe(2);
    expect(history.redoSize()).toBe(1);

    history.push(4);

    expect(history.redoSize()).toBe(0);
    expect(history.redo(4)).toBeNull();
  });
});
