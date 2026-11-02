import { useEffect, useRef } from 'preact/hooks';
import { downloadPng, drawToCanvas } from '../utils/canvas';
import { toErrorMessage } from '../utils/pipeline';
import { UploadZone } from './UploadZone';

type SplitResult = { a: ImageBitmap; b: ImageBitmap };

type Props = {
  sourceFile: File | null;
  splitResult: SplitResult | null;
  busy: boolean;
  onSelectSource: (file: File | null) => void;
  onForceRun: () => void;
  onError: (message: string) => void;
};

export function SplitView({
  sourceFile,
  splitResult,
  busy,
  onSelectSource,
  onForceRun,
  onError,
}: Props) {
  const canvasARef = useRef<HTMLCanvasElement>(null);
  const canvasBRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawToCanvas(canvasARef.current, splitResult?.a ?? null);
    drawToCanvas(canvasBRef.current, splitResult?.b ?? null);
  }, [splitResult]);

  const save = async (bitmap: ImageBitmap, filename: string) => {
    try {
      await downloadPng(bitmap, filename);
    } catch (cause) {
      onError(toErrorMessage(cause));
    }
  };

  return (
    <>
      <section class="panel">
        <div class="panel-head">
          <h2>输入图片</h2>
        </div>
        <UploadZone
          label="合并图（棋盘格交错图）"
          file={sourceFile}
          onSelect={onSelectSource}
          onError={onError}
        />
        <p class="panel-hint">上传由本工具合并生成的图片，将自动拆分为 A、B。</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>拆分结果</h2>
          <div class="panel-actions">
            <button
              type="button"
              class="btn"
              disabled={!sourceFile || busy}
              onClick={onForceRun}
            >
              重新生成
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!splitResult || busy}
              onClick={() => splitResult && save(splitResult.a, `split-a-${Date.now()}.png`)}
            >
              下载 A
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!splitResult || busy}
              onClick={() => splitResult && save(splitResult.b, `split-b-${Date.now()}.png`)}
            >
              下载 B
            </button>
          </div>
        </div>

        {splitResult ? (
          <div class="grid-2">
            <figure class="result-card">
              <figcaption>图 A</figcaption>
              <div class="preview">
                <canvas ref={canvasARef} />
              </div>
            </figure>
            <figure class="result-card">
              <figcaption>图 B</figcaption>
              <div class="preview">
                <canvas ref={canvasBRef} />
              </div>
            </figure>
          </div>
        ) : (
          <div class="placeholder">上传棋盘格合并图后自动拆分</div>
        )}
      </section>
    </>
  );
}
