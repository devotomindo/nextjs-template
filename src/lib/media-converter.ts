import sharp from "sharp";

type CompressImageOptions = {
  buffer: Buffer | ArrayBuffer;
  width?: number;
  quality?: number;
  drop?: number;
  maxSize?: number;
  minQuality?: number;
}

export async function compressImageWebp({
  buffer,
  width = 500,
  quality = 82,
  drop = 2,
  maxSize = 100000, // 100kb
  minQuality = 20,
}: CompressImageOptions): Promise<Buffer> {
  try {
    // Convert ArrayBuffer to Buffer if needed
    const inputBuffer = buffer instanceof ArrayBuffer 
      ? Buffer.from(buffer) 
      : buffer;

    // Validate input parameters
    if (quality < minQuality) {
      throw new Error(`Cannot compress further: quality ${quality} is below minimum ${minQuality}`);
    }

    if (!inputBuffer?.length) {
      throw new Error('Invalid input buffer');
    }

    // Perform compression
    const compressedImage = await sharp(inputBuffer)
      .resize({
        width,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .webp({
        quality,
      })
      .withMetadata()
      .toBuffer();

    // Recursively compress if size is still too large
    if (compressedImage.byteLength > maxSize && quality > minQuality) {
      return compressImageWebp({
        buffer: inputBuffer,
        width,
        quality: quality - drop,
        drop,
        maxSize,
        minQuality,
      });
    }

    return compressedImage;
  } catch (error: Error | any) {
    throw new Error(`Image compression failed: ${error?.message}`);
  }
}
