import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_FEEDBACK_BUCKET = process.env.SUPABASE_FEEDBACK_BUCKET ?? 'feedback-captures';

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mimeType = match[1];
  const base64 = match[2];
  if (!mimeType || !base64) return null;
  return { mimeType, base64 };
}

function mimeToExtension(mimeType: string) {
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  return 'jpg';
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ captures: [] }, { status: 200 });
  }

  const requestedLimit = Number(req.nextUrl.searchParams.get('limit') ?? '12');
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 48)
    : 12;

  const { data, error } = await supabase.storage
    .from(SUPABASE_FEEDBACK_BUCKET)
    .list('', {
      limit,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('[api/captures] list error:', error);
    return NextResponse.json({ captures: [] }, { status: 200 });
  }

  const captures = (data ?? [])
    .map((item) => item.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .map((name) => supabase.storage.from(SUPABASE_FEEDBACK_BUCKET).getPublicUrl(name).data.publicUrl)
    .filter((url): url is string => typeof url === 'string' && url.length > 0);

  return NextResponse.json({ captures }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase is not configured on server' },
      { status: 503 }
    );
  }

  const payload = await req
    .json()
    .catch(() => ({} as { thumbnailDataUrl?: unknown; paletteName?: unknown; sketchVariant?: unknown }));
  const thumbnailDataUrl = typeof payload.thumbnailDataUrl === 'string' ? payload.thumbnailDataUrl : '';

  if (!thumbnailDataUrl) {
    return NextResponse.json({ error: 'thumbnailDataUrl is required' }, { status: 400 });
  }

  const parsed = parseDataUrl(thumbnailDataUrl);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 });
  }

  const imageBuffer = Buffer.from(parsed.base64, 'base64');
  if (imageBuffer.length === 0) {
    return NextResponse.json({ error: 'Empty image payload' }, { status: 400 });
  }

  const ext = mimeToExtension(parsed.mimeType);
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  const objectPath = `${Date.now()}-${randomSuffix}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_FEEDBACK_BUCKET)
    .upload(objectPath, imageBuffer, {
      contentType: parsed.mimeType,
      upsert: false,
      cacheControl: '31536000',
    });

  if (uploadError) {
    console.error('[api/captures] upload error:', uploadError);
    return NextResponse.json({ error: 'Failed to upload capture' }, { status: 500 });
  }

  const publicUrl = supabase.storage.from(SUPABASE_FEEDBACK_BUCKET).getPublicUrl(objectPath).data.publicUrl;

  return NextResponse.json(
    {
      ok: true,
      path: objectPath,
      url: publicUrl,
      paletteName: typeof payload.paletteName === 'string' ? payload.paletteName : null,
      sketchVariant: typeof payload.sketchVariant === 'string' ? payload.sketchVariant : null,
    },
    { status: 201 }
  );
}

