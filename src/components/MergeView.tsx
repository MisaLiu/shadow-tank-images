import { useEffect, useRef } from 'preact/hooks';
import { downloadPng, drawToCanvas } from '../utils/canvas';
import { toErrorMessage } from '../utils/pipeline';
import { UploadZone } from './UploadZone';

type Props = {
  fileA: File | null;
  fileB: File | null;
  mergedBitmap: ImageBitmap | null;
  busy: boolean;
  onSelectA: (file: File | null) => void;
  onSelectB: (file: File | null) => void;
  onForceRun: () => void;
  onError: (message: string) => void;
};

export function MergeView({
  fileA,
  fileB,
  mergedBitmap,
  busy,
  onSelectA,
  onSelectB,
  onForceRun,
  onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawToCanvas(canvasRef.current, mergedBitmap);
  }, [mergedBitmap]);

  const save = async () => {
    if (!mergedBitmap) return;
    try {
      await downloadPng(mergedBitmap, `merged-${Date.now()}.png`);
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
        <div class="grid-2">
          <UploadZone
            label="图片 A"
            file={fileA}
            onSelect={onSelectA}
            onError={onError}
          />
          <UploadZone
            label="图片 B"
            file={fileB}
            onSelect={onSelectB}
            onError={onError}
          />
        </div>
        <p class="panel-hint">A 与 B 需为相同尺寸，选择后自动合成预览。</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>合并结果</h2>
          <div class="panel-actions">
            <button
              type="button"
              class="btn"
              disabled={!fileA || !fileB || busy}
              onClick={onForceRun}
            >
              重新生成
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!mergedBitmap || busy}
              onClick={save}
            >
              下载 PNG
            </button>
          </div>
        </div>

        {mergedBitmap ? (
          <div class="preview">
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <div class="placeholder">选择 A、B 两张图片后自动合成</div>
        )}
      </section>
    </>
  );
}
