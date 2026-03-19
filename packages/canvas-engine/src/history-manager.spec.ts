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
});
