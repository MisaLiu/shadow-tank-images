import { runMerge, runSplit, toErrorMessage } from '../utils/pipeline';
import type { WorkerRequest, WorkerResponse } from '../utils/imageProtocol';

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
};

const processRequest = async (request: WorkerRequest): Promise<ImageBitmap[]> => {
  if (request.type === 'merge') {
    try {
      return [await runMerge(request.a, request.b, request.settings)];
    } finally {
      request.a.close();
      request.b.close();
    }
  }

  try {
    const { a, b } = await runSplit(request.source, request.settings);
    return [a, b];
  } finally {
    request.source.close();
  }
};

scope.onmessage = (event) => {
  const request = event.data;

  processRequest(request)
    .then((images) => {
      scope.postMessage({ id: request.id, ok: true, images }, images);
    })
    .catch((error: unknown) => {
      scope.postMessage({
        id: request.id,
        ok: false,
        error: toErrorMessage(error),
      });
    });
};
