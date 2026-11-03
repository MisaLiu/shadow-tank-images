import { useObjectUrl } from '../hooks/useObjectUrl';
import { downloadUrl, previewUrl } from '../utils/blob';
import { UploadZone } from './UploadZone';

type Props = {
  fileA: File | null;
  fileB: File | null;
  mergedBlob: Blob | null;
  busy: boolean;
  onSelectA: (file: File | null) => void;
  onSelectB: (file: File | null) => void;
  onForceRun: () => void;
  onError: (message: string) => void;
};

export function MergeView({
  fileA,
  fileB,
  mergedBlob,
  busy,
  onSelectA,
  onSelectB,
  onForceRun,
  onError,
}: Props) {
  const mergedUrl = useObjectUrl(mergedBlob);

  const save = () => {
    if (!mergedUrl) return;
    downloadUrl(mergedUrl, `merged-${Date.now()}.png`);
  };

  const preview = () => {
    if (!mergedUrl) return;
    try {
      previewUrl(mergedUrl);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : String(cause));
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
              class="btn"
              disabled={!mergedUrl || busy}
              onClick={preview}
              title="在新标签页中打开"
            >
              预览
            </button>
            <button
              type="button"
              class="btn btn-primary"
              disabled={!mergedUrl || busy}
              onClick={save}
            >
              下载 PNG
            </button>
          </div>
        </div>

        {mergedUrl ? (
          <div class="preview">
            <img src={mergedUrl} alt="合并结果" />
          </div>
        ) : (
          <div class="placeholder">选择 A、B 两张图片后自动合成</div>
        )}
      </section>
    </>
  );
}
