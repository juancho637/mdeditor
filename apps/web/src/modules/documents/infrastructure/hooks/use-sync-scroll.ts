import { useEffect, useRef, useState, useCallback } from 'react';
import type { EditorView } from '@codemirror/view';

interface UseSyncScrollOptions {
  enabled: boolean;
  editorView: EditorView | null;
}

/**
 * Builds a sorted map of source-line → offsetTop from annotated preview elements.
 * Elements must have data-source-line attributes (injected by remarkSourceLines plugin).
 */
function buildLineMap(previewEl: HTMLElement): { line: number; top: number }[] {
  const elements = previewEl.querySelectorAll<HTMLElement>('[data-source-line]');
  const entries: { line: number; top: number }[] = [];
  const scrollTop = previewEl.scrollTop;

  for (const el of elements) {
    const line = parseInt(el.getAttribute('data-source-line')!, 10);
    if (isNaN(line)) continue;
    // offsetTop relative to the scroll container
    const rect = el.getBoundingClientRect();
    const containerRect = previewEl.getBoundingClientRect();
    const top = rect.top - containerRect.top + scrollTop;
    entries.push({ line, top });
  }

  // Sort by line number (should already be in order, but ensure)
  entries.sort((a, b) => a.line - b.line);
  return entries;
}

/**
 * Given a line number and a line map, interpolate the target scroll position.
 */
function interpolateScrollTop(targetLine: number, lineMap: { line: number; top: number }[]): number {
  if (lineMap.length === 0) return 0;
  if (targetLine <= lineMap[0]!.line) return lineMap[0]!.top;
  if (targetLine >= lineMap[lineMap.length - 1]!.line) return lineMap[lineMap.length - 1]!.top;

  // Binary search for the surrounding entries
  let lo = 0;
  let hi = lineMap.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lineMap[mid]!.line <= targetLine) lo = mid;
    else hi = mid;
  }

  const a = lineMap[lo]!;
  const b = lineMap[hi]!;
  if (a.line === b.line) return a.top;

  // Linear interpolation between the two bracketing entries
  const fraction = (targetLine - a.line) / (b.line - a.line);
  return a.top + (b.top - a.top) * fraction;
}

export function useSyncScroll({ enabled, editorView }: UseSyncScrollOptions) {
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  const [previewEl, setPreviewEl] = useState<HTMLElement | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !editorEl || !previewEl || !editorView) return;

    const syncEditorToPreview = () => {
      // Get the first visible line in the editor
      const topBlock = editorView.lineBlockAtHeight(editorView.scrollDOM.scrollTop);
      const topLine = editorView.state.doc.lineAt(topBlock.from).number;

      // Calculate sub-line fraction (how far into that line we've scrolled)
      const lineTop = topBlock.top;
      const lineHeight = topBlock.height || 1;
      const subFraction = (editorView.scrollDOM.scrollTop - lineTop) / lineHeight;
      const preciseTopLine = topLine + Math.max(0, Math.min(1, subFraction));

      // Build line map from annotated preview elements and interpolate
      const lineMap = buildLineMap(previewEl);
      const targetScroll = interpolateScrollTop(preciseTopLine, lineMap);
      const maxScroll = previewEl.scrollHeight - previewEl.clientHeight;
      previewEl.scrollTop = Math.min(targetScroll, maxScroll);
    };

    const syncPreviewToEditor = () => {
      // Find which source-line element is at the top of the preview viewport
      const lineMap = buildLineMap(previewEl);
      if (lineMap.length === 0) return;

      const currentScroll = previewEl.scrollTop;

      // Find the entry just above and below current scroll
      let lo = 0;
      let hi = lineMap.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (lineMap[mid]!.top <= currentScroll) lo = mid;
        else hi = mid;
      }

      const a = lineMap[lo]!;
      const b = lineMap[hi]!;
      let targetLine: number;

      if (a.top === b.top || a.line === b.line) {
        targetLine = a.line;
      } else {
        const fraction = (currentScroll - a.top) / (b.top - a.top);
        targetLine = a.line + (b.line - a.line) * Math.max(0, Math.min(1, fraction));
      }

      // Convert target line to editor scroll position
      const clampedLine = Math.min(Math.max(1, Math.round(targetLine)), editorView.state.doc.lines);
      const lineInfo = editorView.state.doc.line(clampedLine);
      const lineBlock = editorView.lineBlockAt(lineInfo.from);
      editorView.scrollDOM.scrollTop = lineBlock.top;
    };

    const handleEditorScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      syncEditorToPreview();
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    const handlePreviewScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      syncPreviewToEditor();
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    editorEl.addEventListener('scroll', handleEditorScroll, { passive: true });
    previewEl.addEventListener('scroll', handlePreviewScroll, { passive: true });

    return () => {
      isSyncingRef.current = false;
      editorEl.removeEventListener('scroll', handleEditorScroll);
      previewEl.removeEventListener('scroll', handlePreviewScroll);
    };
  }, [enabled, editorEl, previewEl, editorView]);

  const setEditorScroller = useCallback((el: HTMLElement | null) => {
    setEditorEl(el);
  }, []);

  const setPreviewScroller = useCallback((el: HTMLElement | null) => {
    setPreviewEl(el);
  }, []);

  return { setEditorScroller, setPreviewScroller };
}
