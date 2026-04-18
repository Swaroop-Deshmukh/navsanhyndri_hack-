import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from its previous value to the new target value.
 * @param {number} target  - The value to animate to.
 * @param {number} duration - Animation duration in ms (default 600).
 */
export default function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = target;
    if (from === to) return;

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
