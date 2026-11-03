export const downloadUrl = (url: string, filename: string): void => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
};

export const previewUrl = (url: string): void => {
  const win = window.open(url, '_blank');

  if (!win) {
    throw new Error('浏览器拦截了新标签页预览，请允许弹窗后重试');
  }
};
