'use client';

import { useCallback, useRef, useState } from 'react';

const SWIPE_THRESHOLD = 60;

export function useSwipeLeft() {
  const [isSwiped, setIsSwiped] = useState(false);
  const startXRef = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0]?.clientX ?? null;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const delta = endX - startXRef.current;
    if (delta < -SWIPE_THRESHOLD) {
      setIsSwiped(true);
    } else if (delta > SWIPE_THRESHOLD) {
      setIsSwiped(false);
    }
    startXRef.current = null;
  }, []);

  const reset = useCallback(() => setIsSwiped(false), []);

  const onTouchCancel = useCallback(() => {
    startXRef.current = null;
    setIsSwiped(false);
  }, []);

  return {
    isSwiped,
    reset,
    handlers: { onTouchStart, onTouchEnd, onTouchCancel },
  };
}
