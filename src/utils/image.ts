

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

const interpolateCheckerboard = (
  samples: Float32Array,
  mask: Uint8Array,
  width: number,
  height: number,
  targetMask: 0 | 1
) => {
  const pixelsTotal = width * height;

  if (samples.length !== pixelsTotal * 3 ||
      mask.length !== pixelsTotal) {
    throw new RangeError("Invalid image data dimensions");
  }

  const result = samples.slice();

  const getPixel = (x: number, y: number) => {
    if (
      x < 0 || x >= width ||
      y < 0 || y >= height
    ) {
      return -1;
    }

    const index = y * width + x;

    return mask[index] === targetMask ? index : -1;
  };

  const getGradient = (a: number, b: number) => {
    const ia = a * 3;
    const ib = b * 3;

    return (
      Math.abs(samples[ia] - samples[ib]) +
      Math.abs(samples[ia + 1] - samples[ib + 1]) +
      Math.abs(samples[ia + 2] - samples[ib + 2])
    ) / 3;
  };

  const interpolate = (dst: number, a: number, b: number) => {
    const d = dst * 3;
    const ia = a * 3;
    const ib = b * 3;

    result[d] = (samples[ia] + samples[ib]) * 0.5;
    result[d + 1] = (samples[ia + 1] + samples[ib + 1]) * 0.5;
    result[d + 2] = (samples[ia + 2] + samples[ib + 2]) * 0.5;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x;
      if (mask[pixel] === targetMask) continue;

      const left = getPixel(x - 1, y);
      const right = getPixel(x + 1, y);
      const up = getPixel(x, y - 1);
      const down = getPixel(x, y + 1);

      const horizontalValid = left !== -1 && right !== -1;
      const verticalValid = up !== -1 && down !== -1;

      if (horizontalValid && verticalValid) {
        if (getGradient(left, right) <= getGradient(up, down)) {
          interpolate(pixel, left, right);
        } else {
          interpolate(pixel, up, down);
        }
      } else if (horizontalValid) {
        interpolate(pixel, left, right);
      } else if (verticalValid) {
        interpolate(pixel, up, down);
      } else {
        const neighbors = [left, right, up, down].filter(
          index => index !== -1
        );

        if (neighbors.length === 0) continue;

        const dst = pixel * 3;

        for (const index of neighbors) {
          const src = index * 3;

          result[dst] += samples[src] / neighbors.length;
          result[dst + 1] += samples[src + 1] / neighbors.length;
          result[dst + 2] += samples[src + 2] / neighbors.length;
        }
      }
    }
  }

  return result;
};

const createImageDataFromFloat = (
  array: Float32Array,
  width: number,
  height: number,
  mask?: Uint8Array,
  targetMask = 1
) => {
  const pixelsTotal = width * height;

  const rgba = new Uint8ClampedArray(pixelsTotal * 4);

  for (let i = 0; i < pixelsTotal; i++) {
    if (mask && mask[i] !== targetMask) {
      continue;
    }

    const src = i * 3;
    const dst = i * 4;

    rgba[dst] = array[src];
    rgba[dst + 1] = array[src + 1];
    rgba[dst + 2] = array[src + 2];

    rgba[dst + 3] = 255;
  }

  return new ImageData(rgba, width, height);
};

export const splitMergedImages = (
  imageData: Uint8ClampedArray,
  width: number, height: number,
  imgABrightness = 0.25,
  imgBBrightness = 0.835,
  offset = 0,
) => {
  const pixelsTotal = width * height;

  if (imageData.length !== pixelsTotal * 4) {
    throw new RangeError("Invalid image data dimensions");
  }

  const pixelMask = createCheckerMask(width, height, offset);

  const pixelsImgA = new Float32Array(pixelsTotal * 3);
  const pixelsImgB = new Float32Array(pixelsTotal * 3);

  const opacityKeepImgA = 1 - imgABrightness;
  const opacityKeepImgB = 1 - imgBBrightness;

  for (let i = 0; i < pixelsTotal; i++) {
    const src = i * 4;
    const dst = i * 3;

    const r = imageData[src];
    const g = imageData[src + 1];
    const b = imageData[src + 2];

    if (pixelMask[i] === 0) {
      pixelsImgA[dst] = (r - imgABrightness * 255) / opacityKeepImgA;
      pixelsImgA[dst + 1] = (g - imgABrightness * 255) / opacityKeepImgA;
      pixelsImgA[dst + 2] = (b - imgABrightness * 255) / opacityKeepImgA;
    } else {
      pixelsImgB[dst] = r / opacityKeepImgB;
      pixelsImgB[dst + 1] = g / opacityKeepImgB;
      pixelsImgB[dst + 2] = b / opacityKeepImgB;
    }
  }

  const imageDataA = createImageDataFromFloat(
    interpolateCheckerboard(pixelsImgA, pixelMask, width, height, 0),
    width,
    height
  );

  const imageDataB = createImageDataFromFloat(
    interpolateCheckerboard(pixelsImgB, pixelMask, width, height, 1),
    width,
    height
  );
  
  return ({
    a: imageDataA,
    b: imageDataB,
  });
};

export const mergeImagesToCheckerboard = (
  imageA: Uint8ClampedArray,
  imageB: Uint8ClampedArray,
  width: number,
  height: number,
  aWhiteOpacity = 0.25,
  bBlackOpacity = 0.835,
  offset = 0,
): ImageData => {
  const pixelsTotal = width * height;
  const expectedLength = pixelsTotal * 4;

  if (
    imageA.length !== expectedLength ||
    imageB.length !== expectedLength
  ) {
    throw new RangeError("Invalid image data dimensions");
  }

  if (
    aWhiteOpacity < 0 || aWhiteOpacity > 1 ||
    bBlackOpacity < 0 || bBlackOpacity > 1
  ) {
    throw new RangeError("Invalid opacity");
  }

  const mask = createCheckerMask(width, height, offset);

  const result = new Uint8ClampedArray(expectedLength);

  const keepA = 1 - aWhiteOpacity;
  const keepB = 1 - bBlackOpacity;

  const whiteOffset = aWhiteOpacity * 255;

  for (let i = 0; i < pixelsTotal; i++) {
    const index = i * 4;

    if (mask[i] === 0) {
      result[index] = imageA[index] * keepA + whiteOffset;
      result[index + 1] = imageA[index + 1] * keepA + whiteOffset;
      result[index + 2] = imageA[index + 2] * keepA + whiteOffset;
    } else {
      result[index] = imageB[index] * keepB;
      result[index + 1] = imageB[index + 1] * keepB;
      result[index + 2] = imageB[index + 2] * keepB;
    }

    result[index + 3] = 255;
  }

  return new ImageData(result, width, height);
};
