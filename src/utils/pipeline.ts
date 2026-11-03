import { mergeImagesToCheckerboard, splitMergedImages } from './image';

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export type MergeSettings = {
  aWhiteOpacity: number;
  bBlackOpacity: number;
  offset: 0 | 1;
  scalePercent: number;
};

export type SplitSettings = {
  imgABrightness: number;
  imgBBrightness: number;
  offset: 0 | 1;
};

export const DEFAULT_MERGE_SETTINGS: MergeSettings = {
  aWhiteOpacity: 0.25,
  bBlackOpacity: 0.835,
  offset: 0,
  scalePercent: 100,
};

export const DEFAULT_SPLIT_SETTINGS: SplitSettings = {
  imgABrightness: 0.25,
  imgBBrightness: 0.835,
  offset: 0,
};

export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const createCanvas = (width: number, height: number): AnyCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  return canvas;
};

export const decodeToImageData = (
  bitmap: ImageBitmap,
  canvas?: AnyCanvas,
  targetWidth?: number,
  targetHeight?: number,
): ImageData => {
  const width = targetWidth ?? bitmap.width;
  const height = targetHeight ?? bitmap.height;

  const target = canvas ?? createCanvas(width, height);

  target.width = width;
  target.height = height;

  const context = target.getContext('2d', { willReadFrequently: true });
  if (!context) {
    throw new Error('无法创建 2D 绘图上下文');
  }

  context.drawImage(bitmap, 0, 0, width, height);

  return context.getImageData(0, 0, width, height);
};

export const runMerge = async (
  imageA: ImageBitmap,
  imageB: ImageBitmap,
  settings: MergeSettings,
): Promise<ImageBitmap> => {
  if (imageA.width !== imageB.width || imageA.height !== imageB.height) {
    throw new RangeError(
      `两张图片尺寸不一致（A: ${imageA.width}×${imageA.height}，B: ${imageB.width}×${imageB.height}），请使用相同尺寸的图片`,
    );
  }

  if (!Number.isFinite(settings.scalePercent) || settings.scalePercent <= 0) {
    throw new RangeError('缩放比例必须为大于 0 的数值');
  }

  const factor = settings.scalePercent / 100;
  const width = Math.max(1, Math.round(imageA.width * factor));
  const height = Math.max(1, Math.round(imageA.height * factor));

  const canvas = createCanvas(width, height);

  const dataA = decodeToImageData(imageA, canvas, width, height);
  const dataB = decodeToImageData(imageB, canvas, width, height);

  const merged = mergeImagesToCheckerboard(
    dataA.data,
    dataB.data,
    width,
    height,
    settings.aWhiteOpacity,
    settings.bBlackOpacity,
    settings.offset,
  );

  return createImageBitmap(merged);
};

export const runSplit = async (
  source: ImageBitmap,
  settings: SplitSettings,
): Promise<{ a: ImageBitmap; b: ImageBitmap }> => {
  const canvas = createCanvas(source.width, source.height);

  const data = decodeToImageData(source, canvas);

  const { a, b } = splitMergedImages(
    data.data,
    data.width,
    data.height,
    settings.imgABrightness,
    settings.imgBBrightness,
    settings.offset,
  );

  const [bitmapA, bitmapB] = await Promise.all([
    createImageBitmap(a),
    createImageBitmap(b),
  ]);

  return { a: bitmapA, b: bitmapB };
};
