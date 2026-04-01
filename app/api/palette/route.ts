import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  DEFAULT_PALETTE,
  MOODS,
  getPaletteByMood,
  isMood,
  type Mood,
} from '@/lib/emotional-palettes';

const SYSTEM_PROMPT = `You are an expert clinical psychologist specialized in color theory and emotion regulation.

Task:
- Read the user's text (Spanish or English).
- Identify the dominant emotional state.
- Choose exactly ONE mood token from this allowed list:
${MOODS.join(', ')}

Compensation principle:
- Prefer the mood that best represents what the user is feeling now, so the system can apply the therapeutic counterbalance palette.
- If the user message is mixed, prioritize the strongest distress signal.
- If uncertain, choose the closest mood (never invent labels).

Output rules:
- Return ONLY JSON.
- JSON shape: {"mood":"<allowed_token>"}
- Token must be in English and exactly match one item from the allowed list.`;

const MOOD_BY_KEYWORD: Array<{ mood: Mood; keywords: string[] }> = [
  { mood: 'anxious', keywords: ['anxious', 'anxiety', 'ansioso', 'ansiedad', 'nervioso', 'nerviosa', 'nervios'] },
  { mood: 'stressed', keywords: ['stressed', 'stress', 'estresado', 'estresada', 'estrés', 'agobiado', 'agobiada'] },
  { mood: 'overthinking', keywords: ['overthinking', 'ruminating', 'rumiar', 'sobrepensando', 'darle vueltas', 'pensar demasiado'] },
  { mood: 'distracted', keywords: ['distracted', 'distraido', 'distraída', 'disperso', 'dispersa', 'no me concentro', 'scatter'] },
  { mood: 'unmotivated', keywords: ['unmotivated', 'sin motivación', 'desmotivado', 'desmotivada', 'apatía', 'apathy'] },
  { mood: 'overwhelmed', keywords: ['overwhelmed', 'sobrepasado', 'sobrepasada', 'abrumado', 'abrumada', 'colapsado'] },
  { mood: 'melancholic', keywords: ['melancholic', 'melancholy', 'triste', 'tristeza', 'down', 'nostalgia'] },
  { mood: 'unstable', keywords: ['unstable', 'inestable', 'volátil', 'volatil', 'cambios de humor'] },
  { mood: 'bored', keywords: ['bored', 'aburrido', 'aburrida', 'aburrimiento', 'meh'] },
  { mood: 'insecure', keywords: ['insecure', 'inseguro', 'insegura', 'dudo de mi', 'falta de confianza'] },
];

const MOOD_BY_ALIAS: Record<string, Mood> = {
  anxiety: 'anxious',
  ansioso: 'anxious',
  ansiosa: 'anxious',
  nervioso: 'anxious',
  nerviosa: 'anxious',
  stressed_out: 'stressed',
  estresado: 'stressed',
  estresada: 'stressed',
  overthinker: 'overthinking',
  sobrepensando: 'overthinking',
  distracted_attention: 'distracted',
  distraido: 'distracted',
  distraida: 'distracted',
  demotivated: 'unmotivated',
  desmotivado: 'unmotivated',
  desmotivada: 'unmotivated',
  burnout: 'overwhelmed',
  abrumado: 'overwhelmed',
  abrumada: 'overwhelmed',
  sad: 'melancholic',
  sadness: 'melancholic',
  unstable_emotions: 'unstable',
  insecure_confidence: 'insecure',
};

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
}

function inferMoodFromText(feeling: string): Mood | null {
  const normalized = normalizeToken(feeling);
  for (const entry of MOOD_BY_KEYWORD) {
    if (entry.keywords.some((keyword) => normalized.includes(normalizeToken(keyword)))) {
      return entry.mood;
    }
  }
  return null;
}

function resolveMood(candidate: unknown, feeling: string): Mood {
  if (isMood(candidate)) return candidate;
  if (typeof candidate === 'string') {
    const alias = MOOD_BY_ALIAS[normalizeToken(candidate)];
    if (alias) return alias;
  }
  return inferMoodFromText(feeling) ?? DEFAULT_PALETTE.mood;
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({} as { feeling?: unknown }));
  const feeling = typeof payload.feeling === 'string' ? payload.feeling : '';

  if (!feeling) {
    return NextResponse.json({ error: 'No feeling provided' }, { status: 400 });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: feeling },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as { mood?: unknown };

    const mood = resolveMood(parsed.mood, feeling);
    const palette = getPaletteByMood(mood);

    return NextResponse.json({
      mood,
      effect: palette.effect,
      paletteName: palette.name,
      colors: palette.colors,
      source: 'llm',
    });
  } catch (error) {
    console.error('[api/palette] LLM classification failed:', error);
    const fallbackMood = inferMoodFromText(feeling) ?? DEFAULT_PALETTE.mood;
    const fallbackPalette = getPaletteByMood(fallbackMood);
    return NextResponse.json(
      {
        mood: fallbackPalette.mood,
        effect: fallbackPalette.effect,
        paletteName: fallbackPalette.name,
        colors: fallbackPalette.colors,
        source: 'heuristic_fallback',
      },
      { status: 200 }
    );
  }
}
