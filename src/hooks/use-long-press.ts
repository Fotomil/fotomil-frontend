import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent) => void;
  delay?: number;
}

export function useLongPress({ onLongPress, delay = 500 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      onLongPress(e);
      // Prevent the subsequent click from firing
    }, delay);
  }, [onLongPress, delay]);

  const onTouchEnd = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback(() => {
    // Cancel if user moves finger (scrolling)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    didLongPress,
  };
}
