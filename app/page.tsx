'use client';

import { useEffect, useRef, useState } from 'react';
import Welcome from '@/components/Welcome';
import GeometrySketch from '@/components/GeometrySketch';
import GeometrySketchRecursive from '@/components/GeometrySketchRecursive';
import GeometrySketchConicSpheres from '@/components/GeometrySketchConicSpheres';
import { Heart, HeartOff, House } from 'lucide-react';
import { DEFAULT_PALETTE } from '@/lib/emotional-palettes';

type AppState = 'welcome' | 'loading' | 'geometry';
type SketchVariant = 'bars' | 'recursive' | 'conic_spheres';

const SKETCH_VARIANTS: SketchVariant[] = ['bars', 'recursive', 'conic_spheres'];
const CAPTURE_BACKGROUND = '#f5f5f5';

export default function Page() {
  const [screen, setScreen] = useState<AppState>('welcome');
  const [paletteName, setPaletteName] = useState(DEFAULT_PALETTE.name);
  const [sketchVariant, setSketchVariant] = useState<SketchVariant>('bars');
  const [captureGrid, setCaptureGrid] = useState<string[]>([]);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const geometryRef = useRef<HTMLDivElement>(null);
  const webglCaptureRef = useRef<(() => Promise<string>) | null>(null);

  const loadCaptureGrid = async () => {
    const captures = await fetchSupabaseCaptures(12);
    setCaptureGrid(captures);
  };

  useEffect(() => {
    void loadCaptureGrid();
  }, []);

  const handleFeeling = async (feeling: string) => {
    const normalizedFeeling = feeling.trim() || 'geometry';
    setScreen('loading');
    setSketchVariant((prev) => pickRandomSketchVariant(prev));

    try {
      const response = await fetch('/api/palette', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeling: normalizedFeeling }),
      });

      const data = (await response.json()) as { paletteName?: string };
      setPaletteName(data.paletteName ?? DEFAULT_PALETTE.name);
    } catch {
      setPaletteName(DEFAULT_PALETTE.name);
    } finally {
      setScreen('geometry');
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (isSavingFeedback) return;
    setIsSavingFeedback(true);
    try {
      let thumbnailDataUrl: string | undefined;
      if (helpful) {
        const isWebGL = sketchVariant === 'conic_spheres' || sketchVariant === 'recursive';
        if (isWebGL && webglCaptureRef.current) {
          const fullDataUrl = await webglCaptureRef.current();
          thumbnailDataUrl = await scaleDataUrl(fullDataUrl, 125);
        } else {
          thumbnailDataUrl = await captureSketchThumbnail(geometryRef.current, 125);
        }
      }
      if (helpful && thumbnailDataUrl) {
        await saveCaptureToSupabase({
          paletteName,
          sketchVariant,
          thumbnailDataUrl,
        });
      }
      await loadCaptureGrid();
      setScreen('welcome');
    } finally {
      setIsSavingFeedback(false);
    }
  };

  return (
    <div className={screen === 'welcome' ? 'w-full min-h-dvh' : 'w-full h-screen overflow-hidden'}>
      {screen === 'welcome' && (
        <Welcome onSubmit={handleFeeling} captures={captureGrid} />
      )}
      {screen === 'loading' && (
        <div className="w-full h-full flex items-center justify-center" style={{ background: '#fafafa' }}>
          <p style={{ fontSize: '1.2rem', fontWeight: 200, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            Reading your feelings…
          </p>
        </div>
      )}
      {screen === 'geometry' && (
        <div className="w-full h-full relative">
          <div ref={geometryRef} className="absolute inset-0">
            {sketchVariant === 'bars' ? (
              <GeometrySketch paletteName={paletteName} />
            ) : sketchVariant === 'recursive' ? (
              <GeometrySketchRecursive paletteName={paletteName} captureRef={webglCaptureRef} />
            ) : (
              <GeometrySketchConicSpheres paletteName={paletteName} captureRef={webglCaptureRef} />
            )}
          </div>
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleFeedback(true)}
              disabled={isSavingFeedback}
              aria-label="Sí, me ha ayudado"
              title="Sí, me ha ayudado"
              className="w-9 h-9 rounded-full border border-[#0a0a0a] bg-[#0a0a0a] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] hover:border-[#fafafa] transition-colors duration-200 grid place-items-center"
              style={{
                opacity: isSavingFeedback ? 0.5 : 1,
                cursor: isSavingFeedback ? 'not-allowed' : 'pointer',
              }}
            >
              <Heart size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleFeedback(false)}
              disabled={isSavingFeedback}
              aria-label="No me ha ayudado"
              title="No me ha ayudado"
              className="w-9 h-9 rounded-full border border-[#0a0a0a] bg-[#0a0a0a] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] hover:border-[#fafafa] transition-colors duration-200 grid place-items-center"
              style={{
                opacity: isSavingFeedback ? 0.5 : 1,
                cursor: isSavingFeedback ? 'not-allowed' : 'pointer',
              }}
            >
              <HeartOff size={16} />
            </button>
            <button
              type="button"
              onClick={() => setScreen('welcome')}
              disabled={isSavingFeedback}
              aria-label="Volver al inicio"
              title="Volver al inicio"
              className="w-9 h-9 rounded-full border border-[#0a0a0a] bg-[#0a0a0a] text-[#fafafa] hover:bg-[#fafafa] hover:text-[#0a0a0a] hover:border-[#fafafa] transition-colors duration-200 grid place-items-center"
              style={{
                opacity: isSavingFeedback ? 0.5 : 1,
                cursor: isSavingFeedback ? 'not-allowed' : 'pointer',
              }}
            >
              <House size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function pickRandomSketchVariant(previous: SketchVariant): SketchVariant {
  const randomIndex = Math.floor(Math.random() * SKETCH_VARIANTS.length);
  const next = SKETCH_VARIANTS[randomIndex];
  if (next !== previous) return next;
  const alternatives = SKETCH_VARIANTS.filter((variant) => variant !== previous);
  return alternatives[Math.floor(Math.random() * alternatives.length)];
}

async function captureSketchThumbnail(root: HTMLDivElement | null, maxWidth: number): Promise<string | undefined> {
  await waitForNextPaint();
  const canvas = root?.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
    return captureWithHtml2Canvas(root, maxWidth);
  }

  // For WebGL canvases use toDataURL (preserveDrawingBuffer:true is default in p5 v2)
  const gl = (canvas.getContext('webgl2') as WebGL2RenderingContext | null) || (canvas.getContext('webgl') as WebGLRenderingContext | null);
  if (gl) {
    return captureWebGLViaDataURL(canvas, maxWidth);
  }

  const ratio = Math.min(1, maxWidth / canvas.width);
  const targetWidth = Math.max(1, Math.round(canvas.width * ratio));
  const targetHeight = Math.max(1, Math.round(canvas.height * ratio));

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = targetWidth;
  thumbCanvas.height = targetHeight;
  const ctx = thumbCanvas.getContext('2d');
  if (!ctx) return undefined;

  ctx.fillStyle = CAPTURE_BACKGROUND;
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);
  if (isMostlyBlack(thumbCanvas, 0.98) || isMostlyWhite(thumbCanvas, 0.98)) {
    return captureWithHtml2Canvas(root, maxWidth);
  }
  return thumbCanvas.toDataURL('image/jpeg', 0.86);
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function isMostlyBlack(canvas: HTMLCanvasElement, threshold = 0.98) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const { width, height } = canvas;
  const sampleSize = 16;
  const stepX = Math.max(1, Math.floor(width / sampleSize));
  const stepY = Math.max(1, Math.floor(height / sampleSize));
  const imageData = ctx.getImageData(0, 0, width, height).data;
  let dark = 0;
  let total = 0;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      const r = imageData[i] ?? 0;
      const g = imageData[i + 1] ?? 0;
      const b = imageData[i + 2] ?? 0;
      const a = imageData[i + 3] ?? 255;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (a > 8 && luma < 8) dark++;
      total++;
    }
  }
  return total > 0 ? dark / total >= threshold : false;
}

async function captureWithHtml2Canvas(root: HTMLDivElement | null, maxWidth: number): Promise<string | undefined> {
  if (!root) return undefined;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const captured = await html2canvas(root, {
      backgroundColor: null,
      useCORS: true,
      logging: false,
      scale: 1,
    });
    const ratio = Math.min(1, maxWidth / captured.width);
    const targetWidth = Math.max(1, Math.round(captured.width * ratio));
    const targetHeight = Math.max(1, Math.round(captured.height * ratio));
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = targetWidth;
    thumbCanvas.height = targetHeight;
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.fillStyle = CAPTURE_BACKGROUND;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(captured, 0, 0, captured.width, captured.height, 0, 0, targetWidth, targetHeight);
    return thumbCanvas.toDataURL('image/jpeg', 0.86);
  } catch {
    return undefined;
  }
}

async function scaleDataUrl(dataUrl: string, maxWidth: number): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.naturalWidth);
      const tw = Math.max(1, Math.round(img.naturalWidth * ratio));
      const th = Math.max(1, Math.round(img.naturalHeight * ratio));
      const thumb = document.createElement('canvas');
      thumb.width = tw;
      thumb.height = th;
      const ctx = thumb.getContext('2d');
      if (!ctx) { resolve(undefined); return; }
      ctx.fillStyle = CAPTURE_BACKGROUND;
      ctx.fillRect(0, 0, tw, th);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, tw, th);
      resolve(thumb.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => resolve(undefined);
    img.src = dataUrl;
  });
}

async function captureWebGLViaDataURL(canvas: HTMLCanvasElement, maxWidth: number): Promise<string | undefined> {
  try {
    // Draw the WebGL canvas onto an intermediate 2D canvas at full size first.
    // Using a solid background ensures transparent pixels show as CAPTURE_BACKGROUND.
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = canvas.width;
    fullCanvas.height = canvas.height;
    const fullCtx = fullCanvas.getContext('2d');
    if (!fullCtx) return undefined;
    fullCtx.fillStyle = CAPTURE_BACKGROUND;
    fullCtx.fillRect(0, 0, canvas.width, canvas.height);
    fullCtx.drawImage(canvas, 0, 0);

    // Export the intermediate 2D canvas as JPEG — no alpha, so transparent areas
    // become CAPTURE_BACKGROUND and the actual RGB content is always preserved.
    const fullJpeg = fullCanvas.toDataURL('image/jpeg', 0.95);
    if (!fullJpeg || fullJpeg === 'data:,') return undefined;

    return await new Promise<string | undefined>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.naturalWidth);
        const tw = Math.max(1, Math.round(img.naturalWidth * ratio));
        const th = Math.max(1, Math.round(img.naturalHeight * ratio));
        const thumb = document.createElement('canvas');
        thumb.width = tw;
        thumb.height = th;
        const ctx = thumb.getContext('2d');
        if (!ctx) { resolve(undefined); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, tw, th);
        resolve(thumb.toDataURL('image/jpeg', 0.86));
      };
      img.onerror = () => resolve(undefined);
      img.src = fullJpeg;
    });
  } catch {
    return undefined;
  }
}

function captureWebGLPixels(canvas: HTMLCanvasElement, maxWidth: number): string | undefined {
  const gl =
    (canvas.getContext('webgl2') as WebGL2RenderingContext | null) ||
    (canvas.getContext('webgl') as WebGLRenderingContext | null);
  if (!gl) return undefined;

  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) return undefined;

  // Bind the default framebuffer (canvas) so readPixels reads the composited frame
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Detect a completely failed read (all zeros = context lost or no content)
  let hasAnyData = false;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0 || pixels[i + 3] !== 0) {
      hasAnyData = true;
      break;
    }
  }
  if (!hasAnyData) return undefined;

  const flipped = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = y * width * 4;
    const dstRow = (height - 1 - y) * width * 4;
    flipped.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
  }

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return undefined;
  sourceCtx.fillStyle = CAPTURE_BACKGROUND;
  sourceCtx.fillRect(0, 0, width, height);
  sourceCtx.putImageData(new ImageData(flipped, width, height), 0, 0);

  const ratio = Math.min(1, maxWidth / width);
  const targetWidth = Math.max(1, Math.round(width * ratio));
  const targetHeight = Math.max(1, Math.round(height * ratio));
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = targetWidth;
  thumbCanvas.height = targetHeight;
  const thumbCtx = thumbCanvas.getContext('2d');
  if (!thumbCtx) return undefined;
  thumbCtx.fillStyle = CAPTURE_BACKGROUND;
  thumbCtx.fillRect(0, 0, targetWidth, targetHeight);
  thumbCtx.imageSmoothingEnabled = true;
  thumbCtx.imageSmoothingQuality = 'high';
  thumbCtx.drawImage(sourceCanvas, 0, 0, width, height, 0, 0, targetWidth, targetHeight);

  return thumbCanvas.toDataURL('image/jpeg', 0.86);
}

function isMostlyWhite(canvas: HTMLCanvasElement, threshold = 0.98) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const { width, height } = canvas;
  const sampleSize = 16;
  const stepX = Math.max(1, Math.floor(width / sampleSize));
  const stepY = Math.max(1, Math.floor(height / sampleSize));
  const imageData = ctx.getImageData(0, 0, width, height).data;
  let bright = 0;
  let total = 0;

  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const i = (y * width + x) * 4;
      const r = imageData[i] ?? 0;
      const g = imageData[i + 1] ?? 0;
      const b = imageData[i + 2] ?? 0;
      const a = imageData[i + 3] ?? 255;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (a > 8 && luma > 247) bright++;
      total++;
    }
  }
  return total > 0 ? bright / total >= threshold : false;
}

async function fetchSupabaseCaptures(limit = 12): Promise<string[]> {
  try {
    const res = await fetch(`/api/captures?limit=${encodeURIComponent(String(limit))}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { captures?: unknown };
    if (!Array.isArray(data.captures)) return [];
    return data.captures.filter((item): item is string => typeof item === 'string' && item.length > 0);
  } catch {
    return [];
  }
}

async function saveCaptureToSupabase(payload: {
  paletteName: string;
  sketchVariant: SketchVariant;
  thumbnailDataUrl: string;
}) {
  try {
    await fetch('/api/captures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch {
    // Ignore save errors in UI flow.
  }
}
