import sharp from 'sharp';
export async function validateImagePayload(dataUri: string) {
  const fail = (httpStatus: number, code: string, error: string) => ({ valid: false as const, httpStatus, code, error, normalized: undefined as string | undefined });
  if (typeof dataUri !== 'string') return fail(400, 'invalid_image', 'An image is required.');
  if (dataUri.length > 4 * 1024 * 1024 - 1024) return fail(413, 'payload_too_large', 'Choose an image smaller than 3 MB.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUri);
  if (!match) return fail(415, 'unsupported_format', 'Use a JPEG, PNG or WebP image.');
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.toString('base64') !== match[2]) return fail(400, 'corrupted_image', 'Image encoding is invalid.');
  if (buffer.length > 3 * 1024 * 1024) return fail(413, 'payload_too_large', 'Choose an image smaller than 3 MB.');
  try {
    const decoder = sharp(buffer, { limitInputPixels: 25_000_000, failOn: 'warning' }).timeout({ seconds: 5 });
    const meta = await decoder.metadata();
    if (meta.format !== match[1] || (meta.pages || 1) !== 1) return fail(415, 'unsupported_format', 'Use a single image with the correct media type.');
    if (!meta.width || !meta.height || meta.width > 6000 || meta.height > 6000) return fail(400, 'dimensions_exceeded', 'Image dimensions exceed the 6000 pixel limit.');
    // Full decode rejects corrupt pixel streams; rotate before stripping metadata.
    const normalized = await decoder.rotate().resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
    return { valid: true as const, normalized: `data:image/jpeg;base64,${normalized.toString('base64')}`, httpStatus: 200, code: '', error: '' };
  } catch { return fail(400, 'corrupted_image', 'The image is damaged or exceeds decoder limits.'); }
}
