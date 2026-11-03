import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/ai/flows/product-analysis';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/scan',
    service: 'EatInformed Food Label Analysis API'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: 'Image data URI is required in request body.' },
        { status: 400 }
      );
    }

    const dataUriPattern = /^data:image\/(png|jpeg|jpg|webp);base64,/i;
    if (!dataUriPattern.test(image)) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URI (PNG, JPEG, or WEBP).' },
        { status: 400 }
      );
    }

    const maxBase64Length = 10 * 1024 * 1024 * 1.37;
    if (image.length > maxBase64Length) {
      return NextResponse.json(
        { error: 'Image file size exceeds the 10MB limit.' },
        { status: 400 }
      );
    }

    const result = await analyzeProduct(image);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error during food label analysis.';
    console.error('Scan API error:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
