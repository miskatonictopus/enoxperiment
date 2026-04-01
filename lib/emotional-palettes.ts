export type Mood =
  | 'anxious'
  | 'stressed'
  | 'overthinking'
  | 'distracted'
  | 'unmotivated'
  | 'overwhelmed'
  | 'melancholic'
  | 'unstable'
  | 'bored'
  | 'insecure';

export type Effect =
  | 'calming_control'
  | 'mental_reset'
  | 'focus_clarity'
  | 'attention_boost'
  | 'energy_boost'
  | 'emotional_stabilization'
  | 'emotional_warmth'
  | 'balance'
  | 'stimulation'
  | 'confidence_boost';

export interface EmotionalPalette {
  name: string;
  mood: Mood;
  effect: Effect;
  colors: string[];
}

export const MOODS: Mood[] = [
  'anxious',
  'stressed',
  'overthinking',
  'distracted',
  'unmotivated',
  'overwhelmed',
  'melancholic',
  'unstable',
  'bored',
  'insecure',
];

export const EFFECTS: Effect[] = [
  'calming_control',
  'mental_reset',
  'focus_clarity',
  'attention_boost',
  'energy_boost',
  'emotional_stabilization',
  'emotional_warmth',
  'balance',
  'stimulation',
  'confidence_boost',
];

export const emotionalPalettes: EmotionalPalette[] = [
  {
    name: 'Night Pulse',
    mood: 'anxious',
    effect: 'calming_control',
    colors: ['#0b132b', '#1c2541', '#3a86ff', '#5bc0be', '#f1faee'],
  },
  {
    name: 'Neon Abyss',
    mood: 'stressed',
    effect: 'mental_reset',
    colors: ['#0a1128', '#004e64', '#00a5cf', '#9fffc2', '#e6fffa'],
  },
  {
    name: 'Cyber Depth',
    mood: 'overthinking',
    effect: 'focus_clarity',
    colors: ['#14213d', '#1d3557', '#457b9d', '#a8dadc', '#f1fa8c'],
  },
  {
    name: 'Dark Signal',
    mood: 'distracted',
    effect: 'attention_boost',
    colors: ['#101820', '#fee715', '#f97316', '#2563eb', '#f8fafc'],
  },
  {
    name: 'Infra Core',
    mood: 'unmotivated',
    effect: 'energy_boost',
    colors: ['#1f1300', '#ff6b00', '#ff3d00', '#ffc300', '#fff1e6'],
  },
  {
    name: 'Deep Reactor',
    mood: 'overwhelmed',
    effect: 'emotional_stabilization',
    colors: ['#0b3d2e', '#2d6a4f', '#40916c', '#95d5b2', '#d8f3dc'],
  },
  {
    name: 'Digital Ember',
    mood: 'melancholic',
    effect: 'emotional_warmth',
    colors: ['#3d1a2e', '#7b2cbf', '#c9184a', '#ff758f', '#ffb703'],
  },
  {
    name: 'Shadow Circuit',
    mood: 'unstable',
    effect: 'balance',
    colors: ['#1b263b', '#415a77', '#2a9d8f', '#8d6e63', '#e0e1dd'],
  },
  {
    name: 'Pulse Matrix',
    mood: 'bored',
    effect: 'stimulation',
    colors: ['#0f0f0f', '#ff006e', '#fb5607', '#8338ec', '#3a86ff'],
  },
  {
    name: 'Quantum Night',
    mood: 'insecure',
    effect: 'confidence_boost',
    colors: ['#111827', '#1d4ed8', '#10b981', '#f59e0b', '#f3f4f6'],
  },
];

export const DEFAULT_PALETTE = emotionalPalettes[0];

export function isMood(value: unknown): value is Mood {
  return typeof value === 'string' && MOODS.includes(value as Mood);
}

export function isEffect(value: unknown): value is Effect {
  return typeof value === 'string' && EFFECTS.includes(value as Effect);
}

export function getPaletteByMood(mood: Mood): EmotionalPalette {
  return emotionalPalettes.find((palette) => palette.mood === mood) ?? DEFAULT_PALETTE;
}

export function getPaletteByName(name: string): EmotionalPalette {
  return emotionalPalettes.find((palette) => palette.name.toLowerCase() === name.toLowerCase()) ?? DEFAULT_PALETTE;
}
