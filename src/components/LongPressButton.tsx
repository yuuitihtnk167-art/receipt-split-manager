import { useEffect, useRef, useState } from "react";

const LONG_PRESS_DURATION = 800;
const MOVE_CANCEL_THRESHOLD = 12;

type LongPressButtonProps = {
  className: string;
  label: string;
  pressingLabel: string;
  onLongPress: () => void;
};

export function LongPressButton({
  className,
  label,
  pressingLabel,
  onLongPress,
}: LongPressButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const longPressCompletedRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  function clearTimer(): void {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function resetPress(): void {
    clearTimer();
    activePointerIdRef.current = null;
    startPositionRef.current = null;
    longPressCompletedRef.current = false;
    setIsPressing(false);
  }

  function releasePointerCapture(
    button: HTMLButtonElement,
    pointerId: number,
  ): void {
    try {
      if (button.hasPointerCapture(pointerId)) {
        button.releasePointerCapture(pointerId);
      }
    } catch {
      // The browser may already have released capture after a cancelled gesture.
    }
  }

  function cancelPress(button: HTMLButtonElement, pointerId: number): void {
    releasePointerCapture(button, pointerId);
    resetPress();
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      activePointerIdRef.current !== null
    ) {
      return;
    }

    clearTimer();
    event.preventDefault();
    activePointerIdRef.current = event.pointerId;
    startPositionRef.current = { x: event.clientX, y: event.clientY };
    longPressCompletedRef.current = false;
    setIsPressing(true);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Continue with the timer when pointer capture is unavailable.
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      longPressCompletedRef.current = true;
      setIsPressing(false);

      const button = buttonRef.current;
      const pointerId = activePointerIdRef.current;

      if (button && pointerId !== null) {
        releasePointerCapture(button, pointerId);
      }

      activePointerIdRef.current = null;
      startPositionRef.current = null;
      onLongPress();
    }, LONG_PRESS_DURATION);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (
      event.pointerId !== activePointerIdRef.current ||
      startPositionRef.current === null ||
      longPressCompletedRef.current
    ) {
      return;
    }

    const horizontalDistance = event.clientX - startPositionRef.current.x;
    const verticalDistance = event.clientY - startPositionRef.current.y;
    const distance = Math.hypot(horizontalDistance, verticalDistance);

    if (distance > MOVE_CANCEL_THRESHOLD) {
      cancelPress(event.currentTarget, event.pointerId);
    }
  }

  function handlePointerUp(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    cancelPress(event.currentTarget, event.pointerId);
  }

  function handlePointerCancel(
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    if (event.pointerId !== activePointerIdRef.current) {
      return;
    }

    cancelPress(event.currentTarget, event.pointerId);
  }

  useEffect(() => {
    return () => {
      clearTimer();

      const button = buttonRef.current;
      const pointerId = activePointerIdRef.current;

      if (button && pointerId !== null) {
        releasePointerCapture(button, pointerId);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${className} long-press-button${isPressing ? " pressing" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {isPressing ? pressingLabel : label}
    </button>
  );
}
