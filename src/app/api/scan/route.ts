import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { analyzeProduct } from '@/ai/flows/product-analysis';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

async function optimizeImageForAI(dataUri: string): Promise<string> {
  try {
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const optimizedBuffer = await sharp(buffer)
      .resize(768, 768, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
  } catch (err) {
    console.warn('Image optimization skipped, using original:', err);
    return dataUri;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      endpoint: '/api/scan',
      service: 'EatInformed Food Label Analysis API',
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data URI is required in request body.' },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const dataUriPattern = /^data:image\/(png|jpeg|jpg|webp);base64,/i;
    if (!dataUriPattern.test(image)) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URI (PNG, JPEG, or WEBP).' },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const maxBase64Length = 10 * 1024 * 1024 * 1.37;
    if (image.length > maxBase64Length) {
      return NextResponse.json(
        { error: 'Image file size exceeds the 10MB limit.' },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const optimizedImage = await optimizeImageForAI(image);
    const result = await analyzeProduct(optimizedImage);
    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error during food label analysis.';
    console.error('Scan API error:', message);
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
