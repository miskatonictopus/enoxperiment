'use client';

import { useEffect, useRef } from 'react';
// @ts-ignore
import * as THREE from 'three';

// Computes displaced normals via finite differences → hemisphere lighting
// gives the metallic gradient look of the original Codrops demo
const VERTEX = `
uniform vec2 u_mouse;
varying vec2 vUv;
varying vec3 v_normal;

float getBulge(vec2 uvPos) {
  float d = distance(uvPos, u_mouse);
  return smoothstep(0.28, 0.0, d) * 0.5;
}

void main() {
  vUv = uv;

  float bulge = getBulge(uv);
  vec3 newPos = position;
  newPos.z += bulge;

  // Surface normal via finite differences on the bulge field
  float eps = 0.004;
  float bx = getBulge(uv + vec2(eps, 0.0)) - getBulge(uv - vec2(eps, 0.0));
  float by = getBulge(uv + vec2(0.0, eps)) - getBulge(uv - vec2(0.0, eps));
  v_normal = normalize(vec3(-bx / (2.0 * eps), -by / (2.0 * eps), 1.0));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}
`;

const FRAGMENT = `
uniform sampler2D u_texture;
varying vec2 vUv;
varying vec3 v_normal;

void main() {
  vec4 col = texture2D(u_texture, vUv);

  // Hemisphere lighting: bright sky from above-front, dark ground
  vec3 lightDir  = normalize(vec3(0.2, 0.6, 1.0));
  vec3 skyColor  = vec3(1.0, 1.0, 1.0);
  vec3 gndColor  = vec3(0.05, 0.05, 0.08);
  float nDotL    = dot(v_normal, lightDir) * 0.5 + 0.5;
  vec3 hemi      = mix(gndColor, skyColor, nDotL);

  // Specular highlight
  vec3 viewDir   = vec3(0.0, 0.0, 1.0);
  vec3 halfVec   = normalize(lightDir + viewDir);
  float spec     = pow(max(dot(v_normal, halfVec), 0.0), 48.0) * 0.9;

  vec3 lit = col.rgb * hemi + spec;

  gl_FragColor = vec4(lit, col.a);
}
`;

interface BulgeTextProps {
  lines: string[];
  fontSize: number;
  letterSpacingRatio?: number;
  lineHeightRatio?: number;
  color?: string;
  onWidth?: (w: number) => void;
}

function buildTextCanvas(
  lines: string[],
  fontSize: number,
  letterSpacingPx: number,
  lineHeightRatio: number,
  color: string,
  padding: number,
  paddingBottom: number,
  dpr: number,
): { canvas: HTMLCanvasElement; textWidth: number; width: number; height: number } {
  const lineH = fontSize * lineHeightRatio;
  const totalTextH = lineH * lines.length;

  const measure = document.createElement('canvas');
  const mctx = measure.getContext('2d')!;
  mctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  if ('letterSpacing' in mctx) (mctx as any).letterSpacing = `${letterSpacingPx}px`;

  let maxW = 0;
  for (const line of lines) {
    const m = mctx.measureText(line.toUpperCase());
    const w = m.width + fontSize * 0.15;
    if (w > maxW) maxW = w;
  }

  const canvasW = maxW + padding * 2;
  const canvasH = totalTextH + padding + paddingBottom;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(canvasW * dpr);
  canvas.height = Math.ceil(canvasH * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, canvasW, canvasH);

  ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = `${letterSpacingPx}px`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';

  lines.forEach((line, i) => {
    ctx.fillText(line.toUpperCase(), padding, padding + i * lineH);
  });

  return { canvas, textWidth: maxW, width: canvasW, height: canvasH };
}

export default function BulgeText({
  lines,
  fontSize,
  letterSpacingRatio = -0.06,
  lineHeightRatio = 0.85,
  color = '#1a1a1a',
  onWidth,
}: BulgeTextProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    let renderer: THREE.WebGLRenderer | null = null;
    let animId: number;

    const mouse = { x: -2, y: -2 };
    const target = { x: -2, y: -2 };
    let mouseOnCanvas = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = 1.0 - (e.clientY - rect.top) / rect.height;
      if (!mouseOnCanvas) {
        // Snap directly on first entry — avoids traversing through UV (0,0)
        mouse.x = nx;
        mouse.y = ny;
        mouseOnCanvas = true;
      }
      target.x = nx;
      target.y = ny;
    };

    const onMouseLeave = () => {
      mouseOnCanvas = false;
      // Snap immediately off-screen — avoids traversing back through UV (0,0)
      mouse.x = -2;
      mouse.y = -2;
      target.x = -2;
      target.y = -2;
    };

    const dpr = window.devicePixelRatio || 1;
    const letterSpacingPx = letterSpacingRatio * fontSize;
    const padding = fontSize * 4.0;
    const paddingBottom = fontSize * 1;

    const { canvas: textCanvas, textWidth, width: cw, height: ch } =
      buildTextCanvas(lines, fontSize, letterSpacingPx, lineHeightRatio, color, padding, paddingBottom, dpr);

    onWidth?.(textWidth);

    mount.style.width = `${cw}px`;
    mount.style.height = `${ch}px`;
    mount.style.marginLeft = `-${padding}px`;
    mount.style.marginTop = `-${padding}px`;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(cw, ch);
    renderer.setPixelRatio(dpr);
    mount.appendChild(renderer.domElement);

    const aspect = cw / ch;
    const fov = 50;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    camera.position.z = 2;

    const visH = 2 * Math.tan((fov / 2) * (Math.PI / 180)) * camera.position.z;
    const visW = visH * aspect;

    const scene = new THREE.Scene();
    const texture = new THREE.CanvasTexture(textCanvas);

    const uniforms = {
      u_texture: { value: texture },
      u_mouse: { value: new THREE.Vector2(-2, -2) },
    };

    const geo = new THREE.PlaneGeometry(visW, visH, 80, 80);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      transparent: true,
    });

    scene.add(new THREE.Mesh(geo, mat));

    mount.addEventListener('mousemove', onMouseMove);
    mount.addEventListener('mouseleave', onMouseLeave);

    const animate = () => {
      animId = requestAnimationFrame(animate);
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      uniforms.u_mouse.value.set(mouse.x, mouse.y);
      renderer!.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener('mousemove', onMouseMove);
      mount.removeEventListener('mouseleave', onMouseLeave);
      if (renderer && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mountRef} />;
}
