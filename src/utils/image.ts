

const createCheckerMask = (width: number, height: number, offset = 0) => {
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      mask[index] = (x + y + offset) & 1;
    }
  }

  return mask;
};

export const splitImagesFromCanvasCtx = (
  canvasCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  imgABrightness = 0.25,
  imgBBrightness = 0.835
) => {
  const canvas = canvasCtx.canvas;

  const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  const imageWidth = imageData.width;
  const imageHeight = imageData.height;
  const pixelData = imageData.data;
  const pixelsTotal = imageWidth * imageHeight;
  const pixelMask = createCheckerMask(imageWidth, imageHeight);

  const pixelsImgA = new Uint8ClampedArray(pixelsTotal * 4);
  const pixelsImgB = new Uint8ClampedArray(pixelsTotal * 4);

  const opacityKeepImgA = 1 - imgABrightness;
  const opacityKeepImgB = 1 - imgBBrightness;

  for (let i = 0; i < pixelsTotal; i++) {
    const src = i * 4;

    const r = pixelData[src];
    const g = pixelData[src + 1];
    const b = pixelData[src + 2];

    if (pixelMask[i] === 0) {
      pixelsImgA[src] = (r - imgABrightness * 255) / opacityKeepImgA;
      pixelsImgA[src + 1] = (g - imgABrightness * 255) / opacityKeepImgA;
      pixelsImgA[src + 2] = (b - imgABrightness * 255) / opacityKeepImgA;
      pixelsImgA[src + 3] = 255;
    } else {
      pixelsImgB[src] = r / opacityKeepImgB;
      pixelsImgB[src + 1] = g / opacityKeepImgB;
      pixelsImgB[src + 2] = b / opacityKeepImgB;
      pixelsImgB[src + 3] = 255;
    }
  }

  // TODO: Debug, dont use in production
  createImageBitmap(new ImageData(pixelsImgB, imageWidth, imageHeight))
    .then((bitmap) => {
      canvasCtx.drawImage(bitmap, 0, 0);
      bitmap.close();
    })
    .catch(console.error);
};
