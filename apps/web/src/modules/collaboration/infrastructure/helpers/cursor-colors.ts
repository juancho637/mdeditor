const CURSOR_COLORS = [
  { light: '#2F81F7', dark: '#4A9EFF' },  // Azul
  { light: '#28A745', dark: '#3FB950' },  // Verde
  { light: '#F5A623', dark: '#D29922' },  // Naranja
  { light: '#8B5CF6', dark: '#A78BFA' },  // Púrpura
  { light: '#EC4899', dark: '#F472B6' },  // Rosa
  { light: '#14B8A6', dark: '#2DD4BF' },  // Teal
  { light: '#EF4444', dark: '#F87171' },  // Rojo
  { light: '#CA8A04', dark: '#FACC15' },  // Amarillo
] as const;

export const AI_CURSOR_COLOR = '#9333EA';

export function getColorForUser(userId: string): { light: string; dark: string } {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_COLORS.length;
  return CURSOR_COLORS[index]!;
}
