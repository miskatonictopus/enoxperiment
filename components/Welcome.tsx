'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CircleArrowDown, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
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
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTechStackOpen, setIsTechStackOpen] = useState(false);
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
    if (e.key === 'Enter') {
      e.preventDefault();
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
  const isMobile = viewportWidth < 640;

  if (isGalleryOpen) {
    return (
      <div className="w-full min-h-dvh bg-[#1a1a1a] text-[#fafafa]">
        <div className="w-full px-3 py-4 md:px-6 md:py-6">
          <div className="mb-4 flex items-center justify-between">
            <p
              style={{
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              Gallery
            </p>
            <button
              type="button"
              onClick={() => setIsGalleryOpen(false)}
              style={{
                border: '1px solid #666',
                borderRadius: '9999px',
                padding: '0.35rem 0.9rem',
                fontSize: '0.8rem',
                lineHeight: 1.2,
                cursor: 'pointer',
                background: 'transparent',
                color: '#fafafa',
              }}
            >
              Back
            </button>
          </div>

          {captures.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, 125px)',
                gap: '0.5rem',
                width: '100%',
                justifyContent: isMobile ? 'center' : 'start',
              }}
            >
              {captures.map((capture, idx) => (
                <div
                  key={`gallery-${capture.slice(0, 32)}-${idx}`}
                  style={{
                    width: '125px',
                    maxWidth: '125px',
                    aspectRatio: '16 / 9',
                    borderRadius: '8px',
                    overflow: 'hidden',
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
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '0.9rem' }}>No captures yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-dvh bg-[#1a1a1a] text-[#fafafa]">
      <div className="mx-auto w-full max-w-[1600px] px-3 pt-4 pb-28 md:px-6 md:pt-6 md:pb-32">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr] xl:gap-8">
          <div className="order-2 xl:order-1" style={{ overflow: 'visible' }}>
            {isMobile ? (
              <h1
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  lineHeight: 0.85,
                  textTransform: 'uppercase',
                  color: '#fafafa',
                }}
              >
                brian eno
                <br />
                xperience
                <br />
                brain health
                <br />
                experiment
              </h1>
            ) : (
              <BulgeText
                lines={['brian eno', 'xperience', 'brain health', 'experiment']}
                fontSize={titleFontSize}
                letterSpacingRatio={-0.06}
                lineHeightRatio={0.85}
                color="#fafafa"
                onWidth={setTitleWidth}
              />
            )}

            <div
              style={{
                marginTop: isMobile ? '18px' : '48px',
                height: '0.5px',
                background: '#fafafa',
                width: isMobile ? '100%' : titleWidth ?? '100%',
                maxWidth: '100%',
              }}
            />

            <p
              style={{
                marginTop: '0.5em',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 200,
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                color: 'rgb(250, 250, 250)',
                lineHeight: 1.2,
                width: isMobile ? '100%' : titleWidth ?? '100%',
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
                  marginBottom: '30px',
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
                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(true)}
                      style={{
                        color: '#999',
                        fontSize: '0.75rem',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                      }}
                    >
                      View gallery
                    </button>
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
                    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                    gap: '0.5rem',
                    width: '100%',
                  }}
                >
              {captures.slice(-9).map((capture, idx) => (
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
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </div>

      </div>
      <footer
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#1a1a1a',
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            padding: '0.75rem 0.75rem 1rem 0.75rem',
          }}
          className="md:px-6"
        >
          <div style={{ height: '0.5px', background: '#fafafa', width: '100%' }} />
          <div className="mt-3 flex items-center justify-between gap-4">
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
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
            <Dialog.Root open={isTechStackOpen} onOpenChange={setIsTechStackOpen}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.85rem',
                  color: '#fafafa',
                }}
              >
                <span>EDUCATIONAL PROJECT</span>
                <span aria-hidden="true">|</span>
                <Dialog.Trigger
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#fafafa',
                    textAlign: 'right',
                    textDecoration: 'underline',
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Tech stack
                </Dialog.Trigger>
              </div>

              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/70" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-[110] w-[min(880px,94vw)] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-[#444] bg-[#1a1a1a] p-5 text-[#fafafa] shadow-2xl">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <Dialog.Title className="text-xl font-bold tracking-tight">Tech stack</Dialog.Title>
                    <Dialog.Close
                      aria-label="Cerrar"
                      className="grid h-8 w-8 place-items-center rounded-full border border-[#666] bg-transparent text-[#fafafa]"
                    >
                      <X size={16} />
                    </Dialog.Close>
                  </div>

                  <Dialog.Description className="text-sm leading-6 text-[#e8e8e8]">
                    This project is built with Next.js 16 and React 19, using TypeScript for type safety and maintainability.
                  </Dialog.Description>

                  <div className="mt-4 space-y-4 text-sm leading-6 text-[#e8e8e8]">
                    <div>
                      <p className="mb-1 font-semibold text-[#fafafa]">Core technologies</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Next.js 16 (App Router) for the application framework</li>
                        <li>React 19 + React DOM for UI rendering</li>
                        <li>TypeScript for static typing</li>
                        <li>Tailwind CSS v4 for styling and responsive layouts</li>
                        <li>shadcn/ui + Base UI for reusable UI primitives</li>
                        <li>Lucide React for iconography</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 font-semibold text-[#fafafa]">Creative rendering / visuals</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>p5.js for generative sketches and shader-driven visual experiments</li>
                        <li>Three.js with @react-three/fiber and @react-three/drei for 3D/WebGL scenes</li>
                        <li>postprocessing for visual effects pipelines</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 font-semibold text-[#fafafa]">Utility and UX helpers</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>html2canvas for client-side snapshot/capture generation</li>
                        <li>next-themes for theme management</li>
                        <li>clsx, class-variance-authority, and tailwind-merge for class composition patterns</li>
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1 font-semibold text-[#fafafa]">Tooling</p>
                      <ul className="list-disc space-y-1 pl-5">
                        <li>ESLint + eslint-config-next for linting</li>
                        <li>Prettier + prettier-plugin-tailwindcss for formatting</li>
                        <li>PostCSS + Tailwind CSS build pipeline</li>
                      </ul>
                    </div>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </footer>
    </div>
  );
}
