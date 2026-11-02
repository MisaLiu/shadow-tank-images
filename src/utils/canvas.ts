export const drawToCanvas = (
  canvas: HTMLCanvasElement | null,
  bitmap: ImageBitmap | null,
) => {
  if (!canvas) return;

  if (!bitmap) {
    canvas.width = 0;
    canvas.height = 0;
    return;
  }

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
};

export const downloadPng = async (
  bitmap: ImageBitmap,
  filename: string,
): Promise<void> => {
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('无法创建导出画布');
  context.drawImage(bitmap, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('PNG 编码失败');

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
