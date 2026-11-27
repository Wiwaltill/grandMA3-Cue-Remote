export interface FadePreview { cueId: string; durationMs: number; elapsedMs: number; paused: boolean }
export function fadePercent(preview: FadePreview): number {
  if (preview.durationMs<=0) return 100;
  return Math.max(0,Math.min(100,preview.elapsedMs/preview.durationMs*100));
}
export function advanceFade(preview: FadePreview,deltaMs: number): FadePreview {
  return {...preview,elapsedMs:Math.min(preview.durationMs,Math.max(0,preview.elapsedMs+(preview.paused?0:Math.max(0,deltaMs))))};
}
