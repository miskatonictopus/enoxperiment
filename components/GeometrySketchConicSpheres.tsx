'use client';

import { useEffect, useRef } from 'react';
import { getPaletteByName } from '@/lib/emotional-palettes';

interface GeometrySketchConicSpheresProps {
  paletteName?: string;
  captureRef?: { current: (() => Promise<string>) | null };
}

type RGB = [number, number, number];

export default function GeometrySketchConicSpheres({ paletteName, captureRef }: GeometrySketchConicSpheresProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedPalette = getPaletteByName(paletteName ?? 'Night Pulse');

  useEffect(() => {
    if (!mountRef.current) return;

    let instance: any;
    let disposed = false;
    const captureState = { pendingResolve: null as ((dataUrl: string) => void) | null };

    const run = async () => {
      const p5Module = await import('p5');
      const P5 = p5Module.default;
      const container = mountRef.current;
      if (!container || disposed) return;

      (P5 as any).disableFriendlyErrors = true;

      const sketch = (p: any) => {
        let palette = selectedPalette.colors.slice(0, 5);
        let motif: Motif;
        const backgroundColor = '#f5f5f5';

        const lightingVertShader = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying vec3 vNormal;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  vNormal = normalize(uNormalMatrix * aNormal);
  vec4 worldPosition = uModelViewMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * worldPosition;
}
`;

        const lightingFragShader = `
#ifdef GL_ES
precision highp float;
#endif

varying vec3 vNormal;
varying vec2 vTexCoord;

uniform float uTime;
uniform float uGradientType;
uniform float uAnimationType;
uniform float uSpeed;
uniform float uAngle;
uniform float uScale;
uniform float uStripeWidth;
uniform float uStripeCount;
uniform int uColorCount;

uniform vec3 uAmbientColor;
uniform vec3 uDirectionalColor;
uniform vec3 uLightDirection;
uniform float uAlpha;

uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;
uniform vec3 uColor8;
uniform vec3 uColor9;
uniform vec3 uColor10;
uniform vec3 uColor11;
uniform vec3 uColor12;
uniform vec3 uColor13;
uniform vec3 uColor14;
uniform vec3 uColor15;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

mat2 rotate2d(float angle) {
  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 getColorAt(float position) {
  if (uColorCount <= 1) return uColor0;

  position = clamp(position, 0.0, 1.0);
  float scaledPos = position * float(uColorCount - 1);
  int index = int(floor(scaledPos));
  float fraction = fract(scaledPos);

  vec3 color1;
  vec3 color2;

  if (index == 0) { color1 = uColor0; color2 = uColor1; }
  else if (index == 1) { color1 = uColor1; color2 = (uColorCount > 2) ? uColor2 : uColor1; }
  else if (index == 2) { color1 = uColor2; color2 = (uColorCount > 3) ? uColor3 : uColor2; }
  else if (index == 3) { color1 = uColor3; color2 = (uColorCount > 4) ? uColor4 : uColor3; }
  else if (index == 4) { color1 = uColor4; color2 = (uColorCount > 5) ? uColor5 : uColor4; }
  else if (index == 5) { color1 = uColor5; color2 = (uColorCount > 6) ? uColor6 : uColor5; }
  else if (index == 6) { color1 = uColor6; color2 = (uColorCount > 7) ? uColor7 : uColor6; }
  else if (index == 7) { color1 = uColor7; color2 = (uColorCount > 8) ? uColor8 : uColor7; }
  else if (index == 8) { color1 = uColor8; color2 = (uColorCount > 9) ? uColor9 : uColor8; }
  else if (index == 9) { color1 = uColor9; color2 = (uColorCount > 10) ? uColor10 : uColor9; }
  else if (index == 10) { color1 = uColor10; color2 = (uColorCount > 11) ? uColor11 : uColor10; }
  else if (index == 11) { color1 = uColor11; color2 = (uColorCount > 12) ? uColor12 : uColor11; }
  else if (index == 12) { color1 = uColor12; color2 = (uColorCount > 13) ? uColor13 : uColor12; }
  else if (index == 13) { color1 = uColor13; color2 = (uColorCount > 14) ? uColor14 : uColor13; }
  else if (index == 14) { color1 = uColor14; color2 = (uColorCount > 15) ? uColor15 : uColor14; }
  else { color1 = uColor15; color2 = uColor15; }

  return mix(color1, color2, fraction);
}

void main() {
  vec2 st = (vTexCoord - 0.5) * uScale;
  float t = uTime;
  float mixValue = 0.0;

  if (uGradientType == 0.0) {
    vec2 rotated = rotate2d(uAngle) * st;
    mixValue = rotated.x + 0.5;
  } else if (uGradientType == 1.0) {
    mixValue = 1.0 - length(st);
  } else if (uGradientType == 2.0) {
    float z = sqrt(max(0.0, 1.0 - dot(st, st)));
    vec3 normal = normalize(vec3(st.x, st.y, z));
    float lat = normal.y;
    float normalizedLat = (lat + 1.0) * 0.5;
    mixValue = mod(normalizedLat * uStripeCount, 1.0) < uStripeWidth ? 1.0 : 0.0;
  } else if (uGradientType == 4.0) {
    mixValue = (atan(st.y, st.x) + PI) / TWO_PI;
  }

  if (uSpeed > 0.0) {
    if (uAnimationType == 1.0) {
      mixValue = mod(mixValue + t, 1.0);
    } else if (uAnimationType == 5.0) {
      float wave = sin(mixValue * 3.0 + t * 2.0) * 0.5 + 0.5;
      mixValue = wave;
    } else if (uAnimationType == 6.0) {
      float n = noise(st * 5.0 + t);
      mixValue = mix(mixValue, n, 0.3);
    }
  }

  mixValue = clamp(mixValue, 0.0, 1.0);
  vec3 baseColor = getColorAt(mixValue);

  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 ambient = uAmbientColor * baseColor;
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = uDirectionalColor * diff * baseColor;
  vec3 finalColor = ambient + diffuse;

  gl_FragColor = vec4(finalColor, uAlpha);
}
`;

        const shuffleArray = (array: string[]) => {
          const next = array.slice();
          for (let i = next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = next[i];
            next[i] = next[j];
            next[j] = tmp;
          }
          return next;
        };

        const hexToRgbUnit = (hex: string): RGB => {
          const normalized = hex.replace('#', '');
          if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return [1, 1, 1];
          return [
            parseInt(normalized.slice(0, 2), 16) / 255,
            parseInt(normalized.slice(2, 4), 16) / 255,
            parseInt(normalized.slice(4, 6), 16) / 255,
          ];
        };

        class LightingGradientShader {
          shader: any;
          config: {
            gradientType: number;
            animationType: number;
            speed: number;
            angle: number;
            scale: number;
            stripeWidth: number;
            stripeCount: number;
            colors: RGB[];
            ambientStrength: number;
            diffuseStrength: number;
            alpha: number;
          };

          constructor(colors: string[]) {
            this.shader = p.createShader(lightingVertShader, lightingFragShader);
            this.config = {
              gradientType: 4,
              animationType: 5,
              speed: p.random(0.1, 0.3),
              angle: p.random(p.TWO_PI),
              scale: 1,
              stripeWidth: 0.2,
              stripeCount: 8,
              colors: colors.map(hexToRgbUnit),
              ambientStrength: 1,
              diffuseStrength: 1,
              alpha: 0.75,
            };
          }

          apply() {
            p.shader(this.shader);
            this.updateUniforms();
          }

          updateUniforms() {
            const t = p.millis() / 1000;
            this.shader.setUniform('uTime', t * this.config.speed);
            this.shader.setUniform('uGradientType', this.config.gradientType);
            this.shader.setUniform('uAnimationType', this.config.animationType);
            this.shader.setUniform('uSpeed', this.config.speed);
            this.shader.setUniform('uAngle', this.config.angle);
            this.shader.setUniform('uScale', this.config.scale);
            this.shader.setUniform('uStripeWidth', this.config.stripeWidth);
            this.shader.setUniform('uStripeCount', this.config.stripeCount);
            this.shader.setUniform('uColorCount', this.config.colors.length);

            for (let i = 0; i < Math.min(16, this.config.colors.length); i++) {
              this.shader.setUniform(`uColor${i}`, this.config.colors[i]);
            }
            for (let i = this.config.colors.length; i < 16; i++) {
              this.shader.setUniform(`uColor${i}`, [0, 0, 0]);
            }

            this.shader.setUniform('uAmbientColor', [
              this.config.ambientStrength,
              this.config.ambientStrength,
              this.config.ambientStrength,
            ]);
            this.shader.setUniform('uDirectionalColor', [
              this.config.diffuseStrength,
              this.config.diffuseStrength,
              this.config.diffuseStrength,
            ]);
            this.shader.setUniform('uLightDirection', [0.5, -1.0, 0.5]);
            this.shader.setUniform('uAlpha', this.config.alpha);
          }
        }

        class Element {
          id: number;
          originX: number;
          originY: number;
          originZ: number;
          radius: number;
          angleX: number;
          angleY: number;
          angleZ: number;
          angleXAccel: number;
          angleYAccel: number;
          angleZAccel: number;
          amplitudeSize: number;
          isDisplay: boolean;
          gradientShader: LightingGradientShader;

          constructor(props: any) {
            this.id = props.id ?? 0;
            this.originX = props.originX ?? 0;
            this.originY = props.originY ?? 0;
            this.originZ = props.originZ ?? 0;
            this.radius = props.baseSizeR ?? 100;
            this.angleX = props.angleX ?? 0;
            this.angleY = props.angleY ?? 0;
            this.angleZ = props.angleZ ?? 0;
            this.angleXAccel = props.angleXAccel ?? 0;
            this.angleYAccel = props.angleYAccel ?? 0;
            this.angleZAccel = props.angleZAccel ?? 0;
            this.amplitudeSize = 100;
            this.isDisplay = props.isDisplay ?? true;
            this.gradientShader = new LightingGradientShader(shuffleArray(palette));
          }

          run() {
            if (!this.isDisplay) return;
            p.push();
            const mount = p.sin(p.frameCount * 0.05 + this.id) * this.amplitudeSize + this.amplitudeSize * 2;
            p.translate(this.originX, this.originY, this.originZ);
            this.angleX += this.angleXAccel;
            this.angleY += this.angleYAccel;
            this.angleZ += this.angleZAccel;
            p.rotateX(this.angleX);
            p.rotateY(this.angleY);
            p.rotateZ(this.angleZ);
            this.gradientShader.apply();
            p.blendMode(p.MULTIPLY);
            p.sphere(this.radius + mount, 128, 128);
            p.blendMode(p.BLEND);
            p.resetShader();
            p.pop();
          }
        }

        class Motif {
          elements: Element[] = [];

          constructor(repeat = 5) {
            let elementId = 0;
            for (let i = 0; i < repeat; i++) {
              this.elements.push(
                new Element({
                  id: elementId,
                  isDisplay: true,
                  originX: 0,
                  originY: 0,
                  originZ: 1000 - i * 1000,
                  baseSizeR: i * 150 + 50,
                  angleY: p.random(p.TWO_PI),
                  angleXAccel: p.random(-0.05, 0.05),
                  angleYAccel: p.random(-0.05, 0.05),
                  angleZAccel: p.random(-0.05, 0.05),
                })
              );
              elementId++;
            }
          }

          run() {
            p.push();
            const sorted = [...this.elements].sort((a, b) => {
              const aZ = a.originZ + a.id * 0.001;
              const bZ = b.originZ + b.id * 0.001;
              return aZ - bZ;
            });
            for (let i = 0; i < sorted.length; i++) sorted[i].run();
            p.pop();
          }
        }

        const initCamera = () => {
          const d = Math.max(p.width, p.height);
          p.camera(0, 0, -d * 0.25, 0, 0, 0, 0, 1, 0);
          p.ortho(-p.width / 2, p.width / 2, -p.height / 2, p.height / 2, -10000, 10000);
        };

        const fitCanvasToViewport = () => {
          const canvasEl = p.canvas as HTMLCanvasElement | undefined;
          if (!canvasEl) return;
          canvasEl.style.display = 'block';
          canvasEl.style.width = '100vw';
          canvasEl.style.height = '100vh';
        };

        const init = () => {
          palette = selectedPalette.colors.slice(0, 5);
          motif = new Motif(5);
          initCamera();
        };

        p.setup = () => {
          p.createCanvas(window.innerWidth, window.innerHeight, p.WEBGL);
          try {
            p.setAttributes('antialias', true);
            p.setAttributes('depth', false);
            p.setAttributes('alpha', true);
            p.setAttributes('preserveDrawingBuffer', true);
          } catch {
            // Some p5 builds throw when setting attributes dynamically.
          }
          p.angleMode(p.RADIANS);
          p.rectMode(p.CENTER);
          p.ellipseMode(p.CENTER);
          p.textAlign(p.CENTER, p.CENTER);
          p.pixelDensity(1);
          p.smooth();
          p.frameRate(30);
          p.noStroke();
          fitCanvasToViewport();
          init();
        };

        p.draw = () => {
          p.background(backgroundColor);
          p.ambientLight(240);
          p.shininess(20);
          p.pointLight(255, 255, 255, 50, -100, 80);
          p.specularColor(255);
          p.specularMaterial(255);
          motif.run();
          if (captureState.pendingResolve) {
            const resolve = captureState.pendingResolve;
            captureState.pendingResolve = null;
            resolve((p.canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.95));
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(window.innerWidth, window.innerHeight);
          fitCanvasToViewport();
          init();
        };
      };

      instance = new P5(sketch, container);

      if (captureRef) {
        captureRef.current = () => new Promise<string>((resolve) => {
          captureState.pendingResolve = resolve;
        });
      }
    };

    run();

    return () => {
      disposed = true;
      if (instance) instance.remove();
      if (captureRef) captureRef.current = null;
    };
  }, [selectedPalette]);

  return <div ref={mountRef} className="w-full h-full" style={{ width: '100vw', height: '100vh', background: '#f5f5f5' }} />;
}
