import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/ai/flows/product-analysis';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// ponytail: lightweight in-memory per-IP sliding-window rate limiter (20 requests / 60s)
const IP_RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const ipRequestTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestTimestamps.get(ip) || [];
  const valid = timestamps.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= IP_RATE_LIMIT) {
    ipRequestTimestamps.set(ip, valid);
    return true;
  }
  valid.push(now);
  ipRequestTimestamps.set(ip, valid);
  if (ipRequestTimestamps.size > 1000) {
    ipRequestTimestamps.forEach((times, key) => {
      if (times.every((t: number) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestTimestamps.delete(key);
      }
    });
  }
  return false;
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
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many scan requests. Please wait a minute before scanning again.' },
      {
        status: 429,
        headers: corsHeaders,
      }
    );
  }

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

    // ponytail: analyzeProduct optimizes image once internally; avoid duplicate Sharp resize
    const result = await analyzeProduct(image);
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
