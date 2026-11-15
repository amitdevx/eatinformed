import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { analyzeProduct } from '@/ai/flows/product-analysis';
import { isNimConfigured } from '@/ai/nim';
import { adminAuth } from '@/lib/firebase-admin';
import { validateImagePayload } from '@/lib/image-validation';
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
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Idempotency-Key, x-idempotency-key',
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

// In-memory idempotency cache for deduplication on network retries
interface IdempotencyRecord {
  timestamp: number;
  response: any;
}
const idempotencyCache = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 1000 * 60 * 60; // 1 hour

function getIdempotentResponse(key: string): any | null {
  const record = idempotencyCache.get(key);
  if (!record) return null;
  if (Date.now() - record.timestamp > IDEMPOTENCY_TTL_MS) {
    idempotencyCache.delete(key);
    return null;
  }
  return record.response;
}

function storeIdempotentResponse(key: string, response: any): void {
  if (idempotencyCache.size > 200) {
    const oldest = idempotencyCache.keys().next().value;
    if (oldest) idempotencyCache.delete(oldest);
  }
  idempotencyCache.set(key, { timestamp: Date.now(), response });
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
  const requestId = crypto.randomUUID();

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
          code: identity.error || 'auth_required',
          quota: {
            limit: GUEST_QUOTA_LIMIT,
            remaining: 0,
            isGuest: true,
          },
          requestId,
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const quota = inspectQuota(identity.userId, identity.isGuest);
    return NextResponse.json(
      {
        status: 'success',
        quota,
        requestId,
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

  // Deep readiness check
  const nimAvailable = isNimConfigured();
  const authAvailable = Boolean(adminAuth);

  return NextResponse.json(
    {
      status: 'ok',
      endpoint: '/api/scan',
      service: 'EatInformed Food Label Analysis API',
      nimConfigured: nimAvailable,
      authConfigured: authAvailable,
      quotaPolicy: {
        guest: `${GUEST_QUOTA_LIMIT} scans per 2-hour rolling window`,
        member: `${MEMBER_QUOTA_LIMIT} scans per 1-hour rolling window`,
      },
      timestamp: Date.now(),
      requestId,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

  // 1. IP Burst Limiter (Enforced for ALL callers; no public header bypasses)
  if (isIpBurstLimited(ip)) {
    return NextResponse.json(
      {
        error: 'Too many rapid requests. Please wait a moment before scanning again.',
        code: 'ip_burst_limit',
        requestId,
      },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': '60',
        },
      }
    );
  }

  // 2. Cryptographic Authentication & Token Verification (Fail-Closed)
  const rawToken = extractToken(request);
  const identity = await verifyUserToken(rawToken);

  if (!identity.userId) {
    return NextResponse.json(
      {
        error: 'Authentication required. Please sign in or continue as Guest to scan food labels.',
        code: identity.error || 'auth_required',
        requestId,
      },
      {
        status: 401,
        headers: corsHeaders,
      }
    );
  }

  // 3. Request Body & Payload Validation (Validated before quota consumption)
  let image: string;
  try {
    const body = await request.json();
    image = body?.image;
  } catch (_) {
    return NextResponse.json(
      {
        error: 'Malformed JSON payload in request body.',
        code: 'invalid_json',
        requestId,
      },
      { status: 400, headers: corsHeaders }
    );
  }

  // Rigorous image validation: magic bytes, base64 integrity, dimension and pixel caps
  const imageValidation = await validateImagePayload(image);
  if (!imageValidation.valid) {
    return NextResponse.json(
      {
        error: imageValidation.error || 'Invalid image payload.',
        code: imageValidation.code || 'invalid_image',
        requestId,
      },
      {
        status: imageValidation.httpStatus || 400,
        headers: corsHeaders,
      }
    );
  }

  // 4. Idempotency Check (Prevents double-charging on client retries)
  const idempotencyKey =
    request.headers.get('idempotency-key') ||
    request.headers.get('x-idempotency-key');
  
  if (idempotencyKey) {
    const cachedResponse = getIdempotentResponse(`${identity.userId}:${idempotencyKey}`);
    if (cachedResponse) {
      return NextResponse.json(
        { ...cachedResponse, idempotentReplay: true, requestId },
        { status: 200, headers: corsHeaders }
      );
    }
  }

  // 5. True Sliding-Window Quota Admission Check
  // Policy: 4 scans per rolling 2-hour window for guests (50/hr for members)
  const quota = consumeQuotaSlot(identity.userId, identity.isGuest);

  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: identity.isGuest
          ? 'Your guest scan limit has been reached (4 scans per rolling 2-hour window). Please wait or sign in to continue scanning.'
          : `Member scan limit reached (${MEMBER_QUOTA_LIMIT} scans/hr). Please try again later.`,
        code: 'quota_limit_reached',
        limit: quota.limit,
        remaining: 0,
        windowDurationSeconds: quota.windowDurationSeconds,
        nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
        retryAfterSeconds: quota.retryAfterSeconds,
        isGuest: identity.isGuest,
        requestId,
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

  // 6. AI Analysis with Explicit Quota Refund on Non-Success
  try {
    const result = await analyzeProduct(image);

    // If analysis indicates unreadable label or missing food information, refund slot and return 422
    if (result.status === 'unreadable' || result.status === 'no_data') {
      refundQuotaSlot(identity.userId);
      const isUnreadable = result.status === 'unreadable';
      const userMessage = isUnreadable
        ? (result.warnings?.[0] || 'The image was unreadable. Please upload or capture a clearer photo of the food label.')
        : (result.warnings?.[0] || 'No readable ingredient list or nutrition table was found in the photo. Please frame the label closely in good lighting.');

      return NextResponse.json(
        {
          error: userMessage,
          code: isUnreadable ? 'label_unreadable' : 'no_food_data',
          status: result.status,
          slotRefunded: true,
          quota: {
            limit: quota.limit,
            remaining: quota.remaining + 1, // Refunded
            windowDurationSeconds: quota.windowDurationSeconds,
            nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
            isGuest: identity.isGuest,
          },
          requestId,
        },
        {
          status: 422,
          headers: {
            ...corsHeaders,
            'X-RateLimit-Limit': String(quota.limit),
            'X-RateLimit-Remaining': String(quota.remaining + 1),
          },
        }
      );
    }

    const successResponse = {
      ...result,
      quota: {
        limit: quota.limit,
        remaining: quota.remaining,
        windowDurationSeconds: quota.windowDurationSeconds,
        nextAvailableScanTimestamp: quota.nextAvailableScanTimestamp,
        isGuest: identity.isGuest,
      },
      requestId,
    };

    if (idempotencyKey) {
      storeIdempotentResponse(`${identity.userId}:${idempotencyKey}`, successResponse);
    }

    return NextResponse.json(successResponse, {
      status: 200,
      headers: {
        ...corsHeaders,
        'X-RateLimit-Limit': String(quota.limit),
        'X-RateLimit-Remaining': String(quota.remaining),
      },
    });
  } catch (error: unknown) {
    // Explicit refund policy: If AI processing throws, refund the slot immediately
    refundQuotaSlot(identity.userId);

    const isOffline = error instanceof Error && error.message.includes('NVIDIA_API_KEY is not configured');
    const isTimeout = error instanceof Error && (error.message.includes('timeout') || error.message.includes('timed out'));

    const statusCode = isOffline ? 503 : isTimeout ? 504 : 502;
    const errorCode = isOffline ? 'ai_offline' : isTimeout ? 'upstream_timeout' : 'upstream_ai_failure';
    const clientMessage = isOffline
      ? 'The AI food analysis service is temporarily offline. Your scan slot has been refunded.'
      : isTimeout
      ? 'Food label analysis timed out. Your scan slot has been refunded.'
      : 'The AI service encountered an error processing your food label. Your scan slot has been refunded.';

    console.error(`[Scan API Error] [${requestId}] [Slot Refunded]:`, error instanceof Error ? error.message : error);

    return NextResponse.json(
      {
        error: clientMessage,
        code: errorCode,
        slotRefunded: true,
        requestId,
      },
      {
        status: statusCode,
        headers: corsHeaders,
      }
    );
  }
}
