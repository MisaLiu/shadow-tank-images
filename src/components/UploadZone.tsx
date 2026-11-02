import { useEffect, useRef, useState } from 'preact/hooks';
import { toErrorMessage } from '../utils/pipeline';

type Props = {
  label: string;
  file: File | null;
  onSelect: (file: File | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export function UploadZone({ label, file, onSelect, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setMeta(null);
      return;
    }

    let cancelled = false;

    createImageBitmap(file)
      .then((bitmap) => {
        if (cancelled) {
          bitmap.close();
          return;
        }

        setMeta({ width: bitmap.width, height: bitmap.height });

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
        }

        bitmap.close();
      })
      .catch((error: unknown) => {
        if (!cancelled) onError(`无法读取图片：${toErrorMessage(error)}`);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const acceptFile = (candidate: File | undefined | null) => {
    if (!candidate) return;
    if (!candidate.type.startsWith('image/')) {
      onError(`「${candidate.name}」不是图片文件`);
      return;
    }
    onSelect(candidate);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      class={['upload-zone', dragging ? 'is-dragging' : '', disabled ? 'is-disabled' : '']
        .filter(Boolean)
        .join(' ')}
      onClick={openPicker}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        acceptFile(e.dataTransfer?.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const input = e.currentTarget;
          acceptFile(input.files?.[0]);
          input.value = '';
        }}
      />

      <div class="upload-zone-head">
        <span class="upload-zone-label">{label}</span>
        {file && (
          <button
            type="button"
            class="btn btn-icon"
            title="移除"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(null);
            }}
          >
            ×
          </button>
        )}
      </div>

      {file ? (
        <div class="upload-zone-body">
          <div class="thumb">
            <canvas ref={canvasRef} />
          </div>
          <div class="upload-zone-meta">
            <span class="file-name" title={file.name}>
              {file.name}
            </span>
            <span class="file-detail">
              {meta ? `${meta.width} × ${meta.height}` : '读取中…'} · {formatSize(file.size)}
            </span>
          </div>
        </div>
      ) : (
        <div class="upload-zone-empty">
          <strong>点击选择</strong>
          <span>或将图片拖拽到此</span>
        </div>
      )}
    </div>
  );
}
