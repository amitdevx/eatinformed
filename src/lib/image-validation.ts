import sharp from 'sharp';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  code?: 'invalid_data_uri' | 'payload_too_large' | 'corrupted_image' | 'unsupported_format' | 'dimensions_exceeded';
  httpStatus?: number;
  buffer?: Buffer;
  format?: string;
  width?: number;
  height?: number;
}

const MAX_BASE64_BYTES = 10 * 1024 * 1024 * 1.37; // ~13.7MB base64 string for 10MB raw binary
const MAX_DIMENSION = 6000; // 6000px max width or height
const MAX_TOTAL_PIXELS = 25_000_000; // 25 megapixels max to prevent decompression bombs

// Magic byte signatures
const JPEG_HEADER = [0xff, 0xd8, 0xff];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_HEADER = [0x52, 0x49, 0x46, 0x46]; // 'RIFF'
const WEBP_HEADER = [0x57, 0x45, 0x42, 0x50]; // 'WEBP'

function matchBytes(buffer: Buffer, expected: number[], offset = 0): boolean {
  if (buffer.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[offset + i] !== expected[i]) return false;
  }
  return true;
}

function detectImageFormatFromMagicBytes(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (matchBytes(buffer, JPEG_HEADER, 0)) return 'jpeg';
  if (matchBytes(buffer, PNG_HEADER, 0)) return 'png';
  if (matchBytes(buffer, RIFF_HEADER, 0) && matchBytes(buffer, WEBP_HEADER, 8)) return 'webp';
  return null;
}

/**
 * Performs rigorous, defense-in-depth image validation:
 * 1. Data URI structure and base64 size limits.
 * 2. Binary magic byte inspection (JPEG, PNG, WEBP).
 * 3. Sharp metadata decoder check (dimension caps & pixel bomb prevention).
 */
export async function validateImagePayload(dataUri: string): Promise<ImageValidationResult> {
  if (!dataUri || typeof dataUri !== 'string') {
    return {
      valid: false,
      error: 'Image data is required in request body.',
      code: 'invalid_data_uri',
      httpStatus: 400,
    };
  }

  if (dataUri.length > MAX_BASE64_BYTES) {
    return {
      valid: false,
      error: 'Image file size exceeds the 10MB limit.',
      code: 'payload_too_large',
      httpStatus: 413,
    };
  }

  const matches = dataUri.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!matches || !matches[2]) {
    return {
      valid: false,
      error: 'Invalid image format. Expected base64 data URI (PNG, JPEG, or WEBP).',
      code: 'unsupported_format',
      httpStatus: 415,
    };
  }

  const rawBase64 = matches[2];
  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawBase64, 'base64');
    if (buffer.length === 0) {
      throw new Error('Zero length buffer');
    }
  } catch (_) {
    return {
      valid: false,
      error: 'Failed to decode base64 image data.',
      code: 'corrupted_image',
      httpStatus: 400,
    };
  }

  // Magic bytes check
  const detectedFormat = detectImageFormatFromMagicBytes(buffer);
  if (!detectedFormat) {
    return {
      valid: false,
      error: 'Image content does not match declared JPEG, PNG, or WEBP binary format.',
      code: 'unsupported_format',
      httpStatus: 415,
    };
  }

  // Sharp metadata decode verification
  try {
    const meta = await sharp(buffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width <= 0 || height <= 0) {
      return {
        valid: false,
        error: 'Image dimensions could not be read.',
        code: 'corrupted_image',
        httpStatus: 400,
      };
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return {
        valid: false,
        error: `Image dimensions (${width}x${height}) exceed the maximum allowable limit of ${MAX_DIMENSION}px.`,
        code: 'dimensions_exceeded',
        httpStatus: 400,
      };
    }

    const totalPixels = width * height;
    if (totalPixels > MAX_TOTAL_PIXELS) {
      return {
        valid: false,
        error: `Image pixel resolution (${totalPixels} px) exceeds maximum security threshold.`,
        code: 'dimensions_exceeded',
        httpStatus: 400,
      };
    }

    return {
      valid: true,
      buffer,
      format: detectedFormat,
      width,
      height,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: 'Image decoding failed: file may be corrupted or truncated.',
      code: 'corrupted_image',
      httpStatus: 415,
    };
  }
}
