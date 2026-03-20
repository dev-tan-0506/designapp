import { describe, expect, it } from 'vitest';

import { ImageCache } from './image-cache';

type MockImageListener = () => void;

class MockImage {
  src = '';
  private readonly listeners = new Map<string, Set<MockImageListener>>();

  addEventListener(type: string, listener: MockImageListener): void {
    const existingListeners = this.listeners.get(type) ?? new Set<MockImageListener>();
    existingListeners.add(listener);
    this.listeners.set(type, existingListeners);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener();
    }
  }
}

describe('ImageCache', () => {
  it('deduplicates loading listeners for the same image and clears them after load', () => {
    const createdImages: MockImage[] = [];
    const cache = new ImageCache({
      createImage: () => {
        const image = new MockImage();
        createdImages.push(image);
        return image as unknown as HTMLImageElement;
      },
    });
    let invalidationCount = 0;
    const onChange = () => {
      invalidationCount += 1;
    };

    cache.read('https://signed.example/image.png', onChange);
    cache.read('https://signed.example/image.png', onChange);

    createdImages[0]?.dispatch('load');

    cache.read('https://signed.example/image.png', onChange);

    expect(invalidationCount).toBe(1);
  });
});
