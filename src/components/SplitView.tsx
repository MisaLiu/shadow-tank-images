import { useObjectUrl } from '../hooks/useObjectUrl';
import { downloadUrl, previewUrl } from '../utils/blob';
import { UploadZone } from './UploadZone';

type SplitResult = { a: Blob; b: Blob };

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
  const urlA = useObjectUrl(splitResult?.a ?? null);
  const urlB = useObjectUrl(splitResult?.b ?? null);

  const save = (url: string, filename: string) => {
    downloadUrl(url, filename);
  };

  const preview = (url: string) => {
    try {
      previewUrl(url);
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
          </div>
        </div>

        {splitResult && urlA && urlB ? (
          <div class="grid-2">
            <figure class="result-card">
              <div class="result-card-head">
                <figcaption>图 A</figcaption>
                <div class="panel-actions">
                  <button
                    type="button"
                    class="btn"
                    disabled={busy}
                    title="在新标签页中打开"
                    onClick={() => preview(urlA)}
                  >
                    预览
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    disabled={busy}
                    onClick={() => save(urlA, `split-a-${Date.now()}.png`)}
                  >
                    下载 PNG
                  </button>
                </div>
              </div>
              <div class="preview">
                <img src={urlA} alt="拆分结果图 A" />
              </div>
            </figure>

            <figure class="result-card">
              <div class="result-card-head">
                <figcaption>图 B</figcaption>
                <div class="panel-actions">
                  <button
                    type="button"
                    class="btn"
                    disabled={busy}
                    title="在新标签页中打开"
                    onClick={() => preview(urlB)}
                  >
                    预览
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary"
                    disabled={busy}
                    onClick={() => save(urlB, `split-b-${Date.now()}.png`)}
                  >
                    下载 PNG
                  </button>
                </div>
              </div>
              <div class="preview">
                <img src={urlB} alt="拆分结果图 B" />
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
