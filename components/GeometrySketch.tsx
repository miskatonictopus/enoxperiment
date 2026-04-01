'use client';

import { useEffect, useRef } from 'react';
import { getPaletteByName } from '@/lib/emotional-palettes';

interface GeometrySketchProps {
  paletteName?: string;
}

export default function GeometrySketch({ paletteName }: GeometrySketchProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const selectedPalette = getPaletteByName(paletteName ?? 'Night Pulse');
  const backgroundColor = mixWithWhite(selectedPalette.colors[2] ?? '#00a8cc', 0.88);

  useEffect(() => {
    if (!mountRef.current) return;

    let instance: any;
    let disposed = false;

    const run = async () => {
      const p5Module = await import('p5');
      const P5 = p5Module.default;
      const container = mountRef.current;

      if (disposed || !container) return;

      (P5 as any).disableFriendlyErrors = true;

      const sketch = (p: any) => {
        let palette: { name: string; colors: string[] } = { name: 'Default', colors: ['#ffffff', '#000000'] };
        let motif: Motif;

        const repeatArray = (array: string[], repeatCount = 3) => {
          return Array(repeatCount)
            .fill(null)
            .flatMap(() => array);
        };

        const repeatPalette = (sourcePalette: { name: string; colors: string[] }, repeatCount = 3) => {
          return {
            ...sourcePalette,
            colors: repeatArray(sourcePalette.colors, repeatCount),
          };
        };

        const adjustCoordinates = (x0: number, y0: number, x1: number, y1: number, mode: string) => {
          if (mode === 'center') {
            const w = x1 - x0;
            const h = y1 - y0;
            x0 = x0 - w / 2;
            y0 = y0 - h / 2;
            x1 = x0 + w;
            y1 = y0 + h;
          }
          return [x0, y0, x1, y1];
        };

        const setGradientColorStops = (
          gradientColor: CanvasGradient,
          colors: string[],
          colorStops: number[] | null = null,
          offsetColorStop = 0
        ) => {
          const colorsLength = colors.length;
          const setColorStop = (colorStop: number, i: number) => {
            const adjusted = ((colorStop % 1) + 1) % 1;
            gradientColor.addColorStop(adjusted, colors[i]);
          };

          if (colorStops) {
            for (let i = 0; i < colorsLength; i++) {
              setColorStop((colorStops[i] ?? 0) + offsetColorStop, i);
            }
            return;
          }

          for (let i = 0; i < colorsLength; i++) {
            const colorStop = i / colorsLength + offsetColorStop + (1 - (colorsLength - 1) / colorsLength) / 2;
            setColorStop(colorStop, i);
          }
        };

        const setGradient = (options: {
          type?: string;
          style?: string;
          colors?: string[];
          colorStops?: number[] | null;
          offsetColorStop?: number;
          x0?: number;
          y0?: number;
          x1?: number | null;
          y1?: number | null;
          rectMode?: string;
          repetitions?: number;
        }) => {
          const {
            type = 'linear',
            style = 'fill',
            colors = ['#000000', '#ffffff'],
            colorStops = null,
            offsetColorStop = 0,
            x0 = 0,
            y0 = 0,
            x1 = null,
            y1 = null,
            rectMode = 'center',
            repetitions = 3,
          } = options;

          if (x1 === null || y1 === null) {
            throw new Error('For linear gradients x1 and y1 are required');
          }

          const [x0Adjusted, y0Adjusted, x1Adjusted, y1Adjusted] = adjustCoordinates(x0, y0, x1, y1, rectMode);
          const gradientColor = p.drawingContext.createLinearGradient(x0Adjusted, y0Adjusted, x1Adjusted, y1Adjusted);

          const gradientColors = type === 'repeating-linear' ? Array(repetitions).fill(colors).flat() : colors;
          setGradientColorStops(gradientColor, gradientColors, colorStops, offsetColorStop);

          if (style === 'fill' || style === 'both') {
            p.drawingContext.fillStyle = gradientColor;
          }
          if (style === 'stroke' || style === 'both') {
            p.drawingContext.strokeStyle = gradientColor;
          }
          return gradientColor;
        };

        const dropShadow = (shadowColor = p.color(20), shadowBlur = 10, shadowOffsetX = 3, shadowOffsetY = 3) => {
          p.drawingContext.shadowColor = shadowColor;
          p.drawingContext.shadowBlur = shadowBlur;
          p.drawingContext.shadowOffsetX = shadowOffsetX;
          p.drawingContext.shadowOffsetY = shadowOffsetY;
        };

        class Element {
          id: number;
          isDisplay: boolean;
          originX: number;
          originY: number;
          x: number;
          y: number;
          w: number;
          h: number;
          colors: string[];
          phaseShift: number;
          repetitions: number;
          targetH: number;
          baseH: number;

          constructor(props: any = {}) {
            this.id = props.id ?? 0;
            this.isDisplay = props.isDisplay ?? true;
            this.originX = props.originX ?? 0;
            this.originY = props.originY ?? 0;
            this.x = props.x ?? 0;
            this.y = props.y ?? 0;
            this.w = props.w ?? 100;
            this.h = props.h ?? 100;
            this.colors = props.colors ?? palette.colors.slice();
            this.phaseShift = 0.25;
            this.repetitions = 2;
            this.targetH = p.height * 3;
            this.baseH = p.height / 2;
            p.noStroke();
          }

          run = () => {
            if (!this.isDisplay) return;
            p.push();
            p.translate(this.originX, this.originY);
            p.fill(0, 0, 0);

            const gradientY =
              (this.targetH / 2 - this.baseH) * Math.sin(p.frameCount * 0.025 - this.id * this.phaseShift) +
              this.targetH / 2;

            setGradient({
              type: 'repeating-linear',
              style: 'fill',
              colors: this.colors,
              repetitions: this.repetitions,
              x0: this.x,
              y0: this.y,
              x1: this.x,
              y1: gradientY,
              offsetColorStop: 0,
            });

            dropShadow(this.colors[0], 10, 2, 2);
            p.rect(this.x, this.y, this.w, this.h);
            p.pop();
          };
        }

        class Motif {
          originX: number;
          originY: number;
          angle: number;
          repeatX: number;
          elements: Element[];
          stepX: number;
          offsetX: number;

          constructor(props: any = {}) {
            this.originX = props.originX ?? 0;
            this.originY = props.originY ?? 0;
            this.angle = props.angle ?? 0;
            this.repeatX = props.repeatX || Math.ceil(p.width / 50) + 2;
            this.elements = [];
            this.stepX = 50;
            this.offsetX = -((this.repeatX * this.stepX) / 2) + this.stepX / 2;

            for (let i = 0; i < this.repeatX; i++) {
              const element = new Element({
                id: i,
                originX: i * this.stepX + this.offsetX,
                originY: 0,
                w: 50,
                h: p.height,
              });
              this.elements.push(element);
            }
          }

          run = () => {
            p.push();
            p.translate(this.originX, this.originY);
            p.rotate(this.angle);
            for (let i = 0; i < this.elements.length; i++) {
              this.elements[i].run();
            }
            p.pop();
          };
        }

        const init = () => {
          const orgPalette = { name: selectedPalette.name, colors: selectedPalette.colors };
          palette = repeatPalette(orgPalette, 1);
          motif = new Motif({
            originX: p.width / 2,
            originY: p.height / 2,
          });
        };

        p.setup = () => {
          p.createCanvas(container.clientWidth, container.clientHeight);
          p.strokeCap(p.SQUARE);
          p.angleMode(p.RADIANS);
          p.rectMode(p.CENTER);
          p.pixelDensity(1);
          p.noSmooth();
          p.frameRate(30);
          init();
        };

        p.draw = () => {
          p.background(backgroundColor);
          motif.run();
        };

        p.windowResized = () => {
          p.resizeCanvas(container.clientWidth, container.clientHeight);
          init();
        };
      };

      instance = new P5(sketch, container);
    };

    run();

    return () => {
      disposed = true;
      if (instance) instance.remove();
    };
  }, [backgroundColor, selectedPalette]);

  return <div ref={mountRef} className="w-full h-full" style={{ background: backgroundColor }} />;
}

function mixWithWhite(hex: string, whiteRatio: number) {
  const safeRatio = Math.min(1, Math.max(0, whiteRatio));
  const normalized = hex.replace('#', '');
  const isValidHex = /^[0-9a-fA-F]{6}$/.test(normalized);
  if (!isValidHex) return '#f5f5f5';

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  const mixedR = Math.round(r * (1 - safeRatio) + 255 * safeRatio);
  const mixedG = Math.round(g * (1 - safeRatio) + 255 * safeRatio);
  const mixedB = Math.round(b * (1 - safeRatio) + 255 * safeRatio);

  return `rgb(${mixedR}, ${mixedG}, ${mixedB})`;
}
