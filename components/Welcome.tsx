'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CircleArrowDown } from 'lucide-react';
import BulgeText from '@/components/BulgeText';

interface WelcomeProps {
  onSubmit: (feeling: string) => void;
  captures?: string[];
}

const MOOD_LABELS: Array<{ id: string; label: string }> = [
  { id: 'anxious', label: 'Ansioso/a' },
  { id: 'stressed', label: 'Estresado/a' },
  { id: 'overthinking', label: 'Sobrepensando' },
  { id: 'distracted', label: 'Distraído/a' },
  { id: 'unmotivated', label: 'Desmotivado/a' },
  { id: 'overwhelmed', label: 'Abrumado/a' },
  { id: 'melancholic', label: 'Melancólico/a' },
  { id: 'unstable', label: 'Inestable' },
  { id: 'bored', label: 'Aburrido/a' },
  { id: 'insecure', label: 'Inseguro/a' },
];

export default function Welcome({ onSubmit, captures = [] }: WelcomeProps) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [titleWidth, setTitleWidth] = useState<number | undefined>();
  const [viewportWidth, setViewportWidth] = useState(1280);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rootFontSize = useRef(16);
  useEffect(() => {
    rootFontSize.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleAddMood = (label: string) => {
    setValue((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return label;
      const separator = trimmed.endsWith(',') ? ' ' : ', ';
      return `${trimmed}${separator}${label}`;
    });
    textareaRef.current?.focus();
  };

  const titleFontSize =
    viewportWidth < 640
      ? 2.4 * rootFontSize.current
      : viewportWidth < 1024
        ? 3.4 * rootFontSize.current
        : 5.2 * rootFontSize.current;

  return (
    <div className="w-full min-h-dvh bg-[#1a1a1a] text-[#fafafa]">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-4 md:px-6 md:py-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr] xl:gap-8">
          <div className="order-2 xl:order-1" style={{ overflow: 'visible' }}>
            <BulgeText
              lines={['brian eno', 'xperience', 'brain health', 'experiment']}
              fontSize={titleFontSize}
              letterSpacingRatio={-0.06}
              lineHeightRatio={0.85}
              color="#fafafa"
              onWidth={setTitleWidth}
            />

            <div
              style={{
                marginTop: viewportWidth < 640 ? '18px' : '48px',
                height: '0.5px',
                background: '#fafafa',
                width: titleWidth ?? '100%',
                maxWidth: '100%',
              }}
            />

            <p
              style={{
                marginTop: '0.5em',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 200,
                fontSize: viewportWidth < 640 ? '0.8rem' : '0.9rem',
                color: 'rgb(250, 250, 250)',
                lineHeight: 1.2,
                width: titleWidth ?? '100%',
                maxWidth: '100%',
                textAlign: 'justify',
              }}
            >
          Abstract form lies a conceptual framework rooted in a kind of “<strong style={{ fontWeight: 700 }}>quantum response</strong>” to human input. When a user provides a set of words, those words act as variables in a probabilistic system, interpreted by artificial intelligence to generate an image that is inherently unpredictable. This randomness is not meaningless; rather, it mirrors the uncertain and fluid nature of emotional states.<br/><br/>
          In this process, the <strong style={{ fontWeight: 700 }}>AI constructs</strong> a <strong style={{ fontWeight: 700 }}>liminal environment—spaces</strong> that feel in-between, neither fully familiar nor entirely unknown. These environments are intentionally ambiguous, designed to gently disrupt the user’s current emotional pattern. By presenting imagery that exists outside conventional context, the system encourages a shift in perception, allowing the mind to recalibrate.<br/><br/>
          The outcome is not just visual, but <strong style={{ fontWeight: 700 }}>psychological</strong>. The generated image serves as a counterbalance to the user’s mood, subtly guiding it toward equilibrium. Through this interplay between input, randomness, and interpretation, the experience becomes a dynamic loop: the user influences the system, and the system, in turn, influences the user.

Ultimately, this interaction reflects a broader principle—small inputs can lead to complex and unexpected outputs, and within that unpredictability lies the potential for emotional adjustment and renewed mental clarity.
            </p>
          </div>

          <div
            className={`order-1 xl:order-2 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ position: 'relative', zIndex: 1 }}
          >
            <div className="mx-auto w-full max-w-md xl:max-w-[680px]">
              <CircleArrowDown size={44} color="#fafafa" style={{ display: 'block', margin: '0 auto 0.75rem auto' }} />
              <p
                style={{
                  fontSize: viewportWidth < 640 ? '2.2rem' : '2.6rem',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  color: '#fafafa',
                  marginBottom: '0.5rem',
                  lineHeight: 0.95,
                  textAlign: 'right',
                }}
              >
                How are you feeling right now?
              </p>
              <Card style={{ background: '#2a2a2a', border: '1px solid #444' }}>
                <CardContent className="space-y-4 pt-4">
                  <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Hola! Cuéntame cómo estás, qué sientes, qué tienes en mente...abajo tienes etiquetas por si te sirven de ayuda"
                    className="resize-none min-h-28 font-extralight"
                    style={{ color: '#fafafa', background: 'transparent', border: '1px solid #555' }}
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-2">
                    {MOOD_LABELS.map((mood) => (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => handleAddMood(mood.label)}
                        style={{
                          color: '#fafafa',
                          border: '1px solid #666',
                          background: 'transparent',
                          borderRadius: '9999px',
                          padding: '0.2rem 0.6rem',
                          fontSize: '0.75rem',
                          lineHeight: 1.2,
                          cursor: 'pointer',
                        }}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>⌘ + Enter para enviar</span>
                    <Button onClick={handleSubmit} disabled={!value.trim()} style={{ background: '#fafafa', color: '#1a1a1a' }}>
                      <span style={{ fontWeight: 900 }}>SFLUSH</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {captures.length > 0 && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '0.5rem',
                    width: '100%',
                  }}
                >
              {captures.map((capture, idx) => (
                <div
                  key={`${capture.slice(0, 32)}-${idx}`}
                  style={{
                    width: '100%',
                    aspectRatio: '16 / 9',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <img
                    src={capture}
                    alt={`Captura ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'block',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      background: getThumbOverlay(capture, idx),
                    }}
                  />
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>

        <footer style={{ marginTop: '1rem', paddingBottom: '1rem' }}>
          <div style={{ height: '0.5px', background: '#fafafa', width: '100%' }} />
          <p
            style={{
              marginTop: '0.75rem',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '0.85rem',
              color: 'rgb(250, 250, 250)',
            }}
          >
            Thanks to...:{' '}
            <a
              href="https://x.com/ngsm"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgb(250, 250, 250)', textDecoration: 'underline' }}
            >
              Toshiyuki Nagashima
            </a>
            {' '}|{' '}
            <a
              href="https://github.com/romanjeanelie"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgb(250, 250, 250)', textDecoration: 'underline' }}
            >
              Roman Jean-Elie
            </a>
            {' '}|{' '}
          </p>
        </footer>
      </div>
    </div>
  );
}

function getThumbOverlay(capture: string, idx: number) {
  const seed = `${capture.slice(0, 48)}-${idx}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const direction = hash % 4;
  switch (direction) {
    case 0:
      return 'linear-gradient(to bottom, #0a0a0a 0%, transparent 65%)';
    case 1:
      return 'linear-gradient(to right, #0a0a0a 0%, transparent 65%)';
    case 2:
      return 'linear-gradient(to left, #0a0a0a 0%, transparent 65%)';
    default:
      return 'linear-gradient(to top, #0a0a0a 0%, transparent 65%)';
  }
}
