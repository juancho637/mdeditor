'use client';

import { useCallback, useEffect, useRef } from 'react';

const LONG_PRESS_DELAY = 500;

export function useLongPress(onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(onLongPress, LONG_PRESS_DELAY);
  }, [onLongPress]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
  };
}
