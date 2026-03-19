export class HistoryManager<T> {
  private readonly maxEntries: number;
  private readonly past: T[] = [];
  private readonly future: T[] = [];

  constructor(maxEntries = 100) {
    this.maxEntries = maxEntries;
  }

  push(state: T): void {
    this.past.push(state);
    if (this.past.length > this.maxEntries) {
      this.past.shift();
    }
    this.future.length = 0;
  }

  undo(currentState: T): T | null {
    const previousState = this.past.pop();
    if (!previousState) {
      return null;
    }

    this.future.push(currentState);
    return previousState;
  }

  redo(currentState: T): T | null {
    const nextState = this.future.pop();
    if (!nextState) {
      return null;
    }

    this.past.push(currentState);
    return nextState;
  }

  size(): number {
    return this.past.length;
  }
}
