import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSyncScrollOptions {
  enabled: boolean;
}

export function useSyncScroll({ enabled }: UseSyncScrollOptions) {
  const [editorEl, setEditorEl] = useState<HTMLElement | null>(null);
  const [previewEl, setPreviewEl] = useState<HTMLElement | null>(null);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !editorEl || !previewEl) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      const maxScroll = source.scrollHeight - source.clientHeight;
      if (maxScroll <= 0) return;
      const percent = source.scrollTop / maxScroll;
      const targetMax = target.scrollHeight - target.clientHeight;
      if (targetMax <= 0) return;
      target.scrollTop = percent * targetMax;
    };

    const handleEditorScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      syncScroll(editorEl, previewEl);
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    };

    const handlePreviewScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      syncScroll(previewEl, editorEl);
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
  }, [enabled, editorEl, previewEl]);

  const setEditorScroller = useCallback((el: HTMLElement | null) => {
    setEditorEl(el);
  }, []);

  const setPreviewScroller = useCallback((el: HTMLElement | null) => {
    setPreviewEl(el);
  }, []);

  return { setEditorScroller, setPreviewScroller };
}
