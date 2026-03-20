export type CachedImageStatus = 'loading' | 'loaded' | 'error';

export type CachedImageState = {
  image: HTMLImageElement | null;
  status: CachedImageStatus;
};

type ImageCacheEntry = {
  image: HTMLImageElement;
  status: CachedImageStatus;
  listeners: Set<() => void>;
};

type ImageCacheOptions = {
  createImage?: () => HTMLImageElement;
};

export class ImageCache {
  private readonly entries = new Map<string, ImageCacheEntry>();
  private readonly createImage: () => HTMLImageElement;

  constructor(options: ImageCacheOptions = {}) {
    this.createImage = options.createImage ?? (() => new Image());
  }

  read(src: string, onChange?: () => void): CachedImageState {
    if (!src) {
      return {
        image: null,
        status: 'error',
      };
    }

    let entry = this.entries.get(src);
    if (!entry) {
      entry = this.createEntry(src);
      this.entries.set(src, entry);
    }

    if (onChange && entry.status === 'loading') {
      entry.listeners.add(onChange);
    }

    return {
      image: entry.status === 'loaded' ? entry.image : null,
      status: entry.status,
    };
  }

  primeLoaded(src: string, image: HTMLImageElement): void {
    this.entries.set(src, {
      image,
      status: 'loaded',
      listeners: new Set(),
    });
  }

  clear(): void {
    this.entries.clear();
  }

  private createEntry(src: string): ImageCacheEntry {
    const image = this.createImage();
    const entry: ImageCacheEntry = {
      image,
      status: 'loading',
      listeners: new Set(),
    };

    image.addEventListener('load', () => {
      entry.status = 'loaded';
      this.notify(entry);
    });

    image.addEventListener('error', () => {
      entry.status = 'error';
      this.notify(entry);
    });

    image.src = src;

    return entry;
  }

  private notify(entry: ImageCacheEntry): void {
    const listeners = Array.from(entry.listeners);
    entry.listeners.clear();

    for (const listener of listeners) {
      listener();
    }
  }
}
