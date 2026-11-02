import type { MergeSettings, SplitSettings } from './pipeline';

export type WorkerPayload =
  | {
      type: 'merge';
      a: ImageBitmap;
      b: ImageBitmap;
      settings: MergeSettings;
    }
  | {
      type: 'split';
      source: ImageBitmap;
      settings: SplitSettings;
    };

export type WorkerRequest = WorkerPayload & { id: number };

export type WorkerResponse =
  | { id: number; ok: true; images: ImageBitmap[] }
  | { id: number; ok: false; error: string };
