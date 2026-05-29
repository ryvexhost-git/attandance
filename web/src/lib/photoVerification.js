const SAMPLE_SIZE = 32;
const HASH_SIZE = 16;
const HISTOGRAM_BINS = 16;

const loadImage = (src) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Unable to load photo for verification'));
  image.src = src;
});

const drawToCanvas = async (src, size = SAMPLE_SIZE) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d', { willReadFrequently: true });
  const sourceSize = Math.min(image.width, image.height);
  const sourceX = Math.max((image.width - sourceSize) / 2, 0);
  const sourceY = Math.max((image.height - sourceSize) / 2, 0);

  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
  return context.getImageData(0, 0, size, size).data;
};

const getAverageHash = (pixels) => {
  const grayscale = [];

  for (let index = 0; index < pixels.length; index += 4) {
    grayscale.push((pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114));
  }

  const average = grayscale.reduce((sum, value) => sum + value, 0) / grayscale.length;
  return grayscale.map((value) => value >= average ? 1 : 0);
};

const getHistogram = (pixels) => {
  const histogram = new Array(HISTOGRAM_BINS * 3).fill(0);

  for (let index = 0; index < pixels.length; index += 4) {
    histogram[Math.floor(pixels[index] / 16)] += 1;
    histogram[HISTOGRAM_BINS + Math.floor(pixels[index + 1] / 16)] += 1;
    histogram[(HISTOGRAM_BINS * 2) + Math.floor(pixels[index + 2] / 16)] += 1;
  }

  const total = pixels.length / 4;
  return histogram.map((value) => value / total);
};

const hashSimilarity = (hashA, hashB) => {
  const matches = hashA.reduce((total, value, index) => total + (value === hashB[index] ? 1 : 0), 0);
  return matches / hashA.length;
};

const histogramSimilarity = (histogramA, histogramB) => {
  const overlap = histogramA.reduce((total, value, index) => total + Math.min(value, histogramB[index]), 0);
  return overlap / 3;
};

export const comparePhotos = async (referencePhoto, selfiePhoto) => {
  const [referencePixels, selfiePixels] = await Promise.all([
    drawToCanvas(referencePhoto, HASH_SIZE),
    drawToCanvas(selfiePhoto, HASH_SIZE)
  ]);

  const [referenceColorPixels, selfieColorPixels] = await Promise.all([
    drawToCanvas(referencePhoto),
    drawToCanvas(selfiePhoto)
  ]);

  const referenceHash = getAverageHash(referencePixels);
  const selfieHash = getAverageHash(selfiePixels);
  const referenceHistogram = getHistogram(referenceColorPixels);
  const selfieHistogram = getHistogram(selfieColorPixels);

  const structureScore = hashSimilarity(referenceHash, selfieHash);
  const colorScore = histogramSimilarity(referenceHistogram, selfieHistogram);
  const score = Math.round(((structureScore * 0.65) + (colorScore * 0.35)) * 100);

  return Math.max(0, Math.min(score, 100));
};
