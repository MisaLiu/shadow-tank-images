import { runMerge, runSplit } from './pipeline';
import type { MergeSettings, SplitSettings } from './pipeline';
import type { WorkerPayload, WorkerRequest, WorkerResponse } from './imageProtocol';

type OkResponse = Extract<WorkerResponse, { ok: true }>;

const workerSupported =
  typeof Worker !== 'undefined' &&
  typeof OffscreenCanvas !== 'undefined' &&
  typeof createImageBitmap === 'function';

let worker: Worker | null = null;
let nextId = 0;

const pending = new Map<
  number,
  { resolve: (response: OkResponse) => void; reject: (error: Error) => void }
>();

const ensureWorker = (): Worker => {
  if (worker) return worker;

  const created = new Worker(
    new URL('../workers/image.worker.ts', import.meta.url),
    { type: 'module' },
  );

  created.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const message = event.data;
    const entry = pending.get(message.id);
    if (!entry) return;

    pending.delete(message.id);

    if (message.ok) {
      entry.resolve(message);
    } else {
      entry.reject(new Error(message.error));
    }
  };

  created.onerror = (event) => {
    const error = new Error(event.message || '图像处理 Worker 运行失败');

    for (const [, entry] of pending) {
      entry.reject(error);
    }
    pending.clear();

    created.terminate();
    if (worker === created) worker = null;
  };

  worker = created;

  return created;
};

const callWorker = (
  payload: WorkerPayload,
  transfer: Transferable[],
): Promise<OkResponse> => {
  const target = ensureWorker();
  const id = ++nextId;

  return new Promise<OkResponse>((resolve, reject) => {
    pending.set(id, { resolve, reject });

    try {
      const request = { ...payload, id } as WorkerRequest;
      target.postMessage(request, transfer);
    } catch (error) {
      pending.delete(id);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

const decodePair = async (a: Blob, b: Blob): Promise<[ImageBitmap, ImageBitmap]> => {
  const bitmapA = await createImageBitmap(a);

  let bitmapB: ImageBitmap;
  try {
    bitmapB = await createImageBitmap(b);
  } catch (error) {
    bitmapA.close();
    throw error;
  }

  return [bitmapA, bitmapB];
};

export const processMerge = async (
  a: Blob,
  b: Blob,
  settings: MergeSettings,
): Promise<ImageBitmap> => {
  const [bitmapA, bitmapB] = await decodePair(a, b);

  if (!workerSupported) {
    try {
      return await runMerge(bitmapA, bitmapB, settings);
    } finally {
      bitmapA.close();
      bitmapB.close();
    }
  }

  try {
    const response = await callWorker(
      { type: 'merge', a: bitmapA, b: bitmapB, settings },
      [bitmapA, bitmapB],
    );

    return response.images[0];
  } catch (error) {
    bitmapA.close();
    bitmapB.close();
    throw error;
  }
};

export const processSplit = async (
  source: Blob,
  settings: SplitSettings,
): Promise<{ a: ImageBitmap; b: ImageBitmap }> => {
  const bitmap = await createImageBitmap(source);

  if (!workerSupported) {
    try {
      return await runSplit(bitmap, settings);
    } finally {
      bitmap.close();
    }
  }

  try {
    const response = await callWorker(
      { type: 'split', source: bitmap, settings },
      [bitmap],
    );

    return { a: response.images[0], b: response.images[1] };
  } catch (error) {
    bitmap.close();
    throw error;
  }
};

export const describeWorkerMode = (): string =>
  workerSupported ? 'Worker + OffscreenCanvas' : '主线程回退';
