export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

let lastPreviewUrl: string | null = null;

export const previewBlob = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');

  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error('浏览器拦截了新标签页预览，请允许弹窗后重试');
  }

  if (lastPreviewUrl) URL.revokeObjectURL(lastPreviewUrl);
  lastPreviewUrl = url;
};
