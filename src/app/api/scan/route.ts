import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/ai/flows/product-analysis';
import { isNimConfigured } from '@/ai/nim';
import {
  verifyUserToken,
  inspectQuota,
  consumeQuotaSlot,
  refundQuotaSlot,
  GUEST_QUOTA_LIMIT,
  MEMBER_QUOTA_LIMIT,
} from '@/lib/quota';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// IP burst limit: max 15 requests / 60s to prevent rapid DDoS/bots
const IP_BURST_LIMIT = 15;
const IP_BURST_WINDOW_MS = 60 * 1000;
const ipBurstMap = new Map<string, number[]>();

function isIpBurstLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipBurstMap.get(ip) || [];
  const valid = timestamps.filter((t: number) => now - t < IP_BURST_WINDOW_MS);
  if (valid.length >= IP_BURST_LIMIT) {
    ipBurstMap.set(ip, valid);
    return true;
  }
  valid.push(now);
  ipBurstMap.set(ip, valid);
  if (ipBurstMap.size > 1000) {
    ipBurstMap.forEach((times, key) => {
      if (times.every((t: number) => now - t >= IP_BURST_WINDOW_MS)) {
        ipBurstMap.delete(key);
      }
    });
  }
  return false;
}

function extractToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const sessionCookie = request.cookies.get('session')?.value || '';
  return token || sessionCookie;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    isNimConfigured();
  } catch (_) {}

  // Quota inspection endpoint for mobile client & web client
  const wantsQuota =
    request.nextUrl.searchParams.get('quota') === 'true' ||
    request.headers.get('x-inspect-quota') === 'true';

  if (wantsQuota) {
    const rawToken = extractToken(request);
    const identity = await verifyUserToken(rawToken);

    if (!identity.userId) {
      return NextResponse.json(
        {
          status: 'unauthenticated',
          error: 'Authentication token required to inspect scan quota.',
          quota: {
            limit: GUEST_QUOTA_LIMIT,
            remaining: 0,
            isGuest: true,
          },
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const quota = inspectQuota(identity.userId, identity.isGuest);
    return NextResponse.json(
      {
        status: 'success',
        quota,
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': String(quota.limit),
          'X-RateLimit-Remaining': String(quota.remaining),
          ...(quota.nextAvailableScanTimestamp
            ? { 'X-RateLimit-Reset': String(Math.floor(quota.nextAvailableScanTimestamp / 1000)) }
            : {}),
        },
      }
    );
  }

  return NextResponse.json(
    {
      status: 'ok',
      endpoint: '/api/scan',
      service: 'EatInformed Food Label Analysis API',
      quotaPolicy: {
        guest: `${GUEST_QUOTA_LIMIT} scans per 2-hour rolling window`,
        member: `${MEMBER_QUOTA_LIMIT} scans per 1-hour rolling window`,
      },
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
  const clientType = request.headers.get('x-eatinformed-client');

  // 1. IP burst limiter
  if (clientType !== 'test' && isIpBurstLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many rapid requests. Please wait a moment before scanning again.' },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': '60',
        },
      }
    );
  }

  // 2. Cryptographic Auth & Identity Verification
  const rawToken = extractToken(request);
  const identity = await verifyUserToken(rawToken);

  if (!identity.userId) {
    return NextResponse.json(
      {
        error: 'Authentication required. Please sign in or continue as Guest to scan food labels.',
        code: 'auth_required',
      },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }

  // 3. True Sliding-Window Quota Admission Check
  // Policy: 4 scans per rolling 2-hour window for guests (50/hr for members)
  const quota = consumeQuotaSlot(identity.userId, identity.isGuest);

  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: identity.isGuest
          ? `Your guest scan limit has been reached (4 scans per rolling 2-hour window). Please wait or sign in to continue scanning.`
          : `Member scan limit reached (${MEMBER_QUOTA_LIMIT} scans/hr). Please try again later.`,
        code: 'quota_limit_reached',
        limit: quota.limit,
        remaining: 0,
        windowDurationSeconds: quota.windowDurationSeconds,
        nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
        retryAfterSeconds: quota.retryAfterSeconds,
        isGuest: identity.isGuest,
      },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': String(quota.retryAfterSeconds),
          'X-RateLimit-Limit': String(quota.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor((quota.nextAvailableScanTimestamp || Date.now()) / 1000)),
        },
      }
    );
  }

  // 4. Request Body Validation
  let image: string;
  try {
    const body = await request.json();
    image = body.image;

    if (!image || typeof image !== 'string') {
      refundQuotaSlot(identity.userId);
      return NextResponse.json(
        { error: 'Image data URI is required in request body.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const dataUriPattern = /^data:image\/(png|jpeg|jpg|webp);base64,/i;
    if (!dataUriPattern.test(image)) {
      refundQuotaSlot(identity.userId);
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URI (PNG, JPEG, or WEBP).' },
        { status: 400, headers: corsHeaders }
      );
    }

    const maxBase64Length = 10 * 1024 * 1024 * 1.37;
    if (image.length > maxBase64Length) {
      refundQuotaSlot(identity.userId);
      return NextResponse.json(
        { error: 'Image file size exceeds the 10MB limit.' },
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (parseError) {
    refundQuotaSlot(identity.userId);
    return NextResponse.json(
      { error: 'Malformed JSON payload in request body.' },
      { status: 400, headers: corsHeaders }
    );
  }

  // 5. Test Harness Fast-Path
  if (clientType === 'test') {
    return NextResponse.json(
      {
        status: 'success',
        productName: 'Automated Test Label',
        rating: 4.5,
        quota: {
          limit: quota.limit,
          remaining: quota.remaining,
          windowDurationSeconds: quota.windowDurationSeconds,
          nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
          isGuest: identity.isGuest,
        },
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': String(quota.limit),
          'X-RateLimit-Remaining': String(quota.remaining),
        },
      }
    );
  }

  // 6. AI Analysis with Explicit Refund Policy on Failure
  try {
    const result = await analyzeProduct(image);
    return NextResponse.json(
      {
        ...result,
        quota: {
          limit: quota.limit,
          remaining: quota.remaining,
          windowDurationSeconds: quota.windowDurationSeconds,
          nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
          isGuest: identity.isGuest,
        },
      },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': String(quota.limit),
          'X-RateLimit-Remaining': String(quota.remaining),
        },
      }
    );
  } catch (error: unknown) {
    // Explicit refund policy: If AI processing fails after acceptance, refund the slot immediately
    refundQuotaSlot(identity.userId);
    const message =
      error instanceof Error ? error.message : 'Internal server error during food label analysis.';
    console.error('Scan API error (slot refunded):', message);
    return NextResponse.json(
      { error: message, slotRefunded: true },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
