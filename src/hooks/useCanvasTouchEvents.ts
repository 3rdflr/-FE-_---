import { useCallback, useRef } from "react";
import { Metadata } from "../types/metadata";
import { CanvasRenderer } from "../utils/canvasRenderer";

interface RenderState {
  baseImageX: number;
  baseImageY: number;
  baseImageScale: number;
  baseImage: HTMLImageElement | null;
}

interface UseCanvasTouchEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewport: { zoom: number; offsetX: number; offsetY: number };
  currentDrawingId: string | null;
  metadata: Metadata | null;
  renderState: RenderState;
  renderer: CanvasRenderer | null;
  setViewport: (viewport: Partial<{ zoom: number; offsetX: number; offsetY: number }>) => void;
  selectDrawing: (drawingId: string) => void;
  onAnnotationTap?: (clientX: number, clientY: number) => void;
}

export const useCanvasTouchEvents = ({
  canvasRef,
  viewport,
  currentDrawingId,
  metadata,
  renderState,
  renderer,
  setViewport,
  selectDrawing,
  onAnnotationTap,
}: UseCanvasTouchEventsProps) => {
  const isTouching = useRef(false);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const touchMoved = useRef(false);

  // 터치 탭으로 hotspot 클릭 처리
  const handleTouchTap = useCallback(
    (x: number, y: number) => {
      if (currentDrawingId !== "00" || !metadata || !renderState.baseImage) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const tapX = x - rect.left;
      const tapY = y - rect.top;

      const buildings = Object.values(metadata.drawings).filter(
        (d) => d.parent === "00",
      );

      for (const building of buildings) {
        if (!building.position?.vertices) continue;

        const isInside = renderer?.isPointInHotspot(
          tapX,
          tapY,
          building.position.vertices,
          renderState.baseImageX,
          renderState.baseImageY,
          renderState.baseImageScale,
          viewport.offsetX,
          viewport.offsetY,
          viewport.zoom,
        );

        if (isInside) {
          selectDrawing(building.id);
          return;
        }
      }
    },
    [currentDrawingId, metadata, renderState, viewport, renderer, selectDrawing, canvasRef],
  );

  // 터치 시작
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        isTouching.current = true;
        touchMoved.current = false;
        touchStartTime.current = Date.now();
        lastPinchDist.current = null;
        const pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastTouchPos.current = pos;
        touchStartPos.current = pos;
      } else if (e.touches.length === 2) {
        touchMoved.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
        lastTouchPos.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    },
    [],
  );

  // 터치 이동
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isTouching.current && lastPinchDist.current === null) {
        const dx = e.touches[0].clientX - lastTouchPos.current.x;
        const dy = e.touches[0].clientY - lastTouchPos.current.y;

        const totalDx = e.touches[0].clientX - touchStartPos.current.x;
        const totalDy = e.touches[0].clientY - touchStartPos.current.y;
        if (Math.abs(totalDx) > 8 || Math.abs(totalDy) > 8) {
          touchMoved.current = true;
        }

        setViewport({
          offsetX: viewport.offsetX + dx,
          offsetY: viewport.offsetY + dy,
        });

        lastTouchPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if (e.touches.length === 2) {
        touchMoved.current = true;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

        if (lastPinchDist.current !== null) {
          const scale = dist / lastPinchDist.current;
          const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * scale));

          const canvas = canvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const pinchX = midX - rect.left;
            const pinchY = midY - rect.top;

            const zoomChange = newZoom / viewport.zoom;
            const newOffsetX = pinchX - (pinchX - viewport.offsetX) * zoomChange;
            const newOffsetY = pinchY - (pinchY - viewport.offsetY) * zoomChange;

            setViewport({
              zoom: newZoom,
              offsetX: newOffsetX,
              offsetY: newOffsetY,
            });
          }
        }

        lastPinchDist.current = dist;
        lastTouchPos.current = { x: midX, y: midY };
      }
    },
    [viewport, setViewport, canvasRef],
  );

  // 터치 종료 - 탭 판별
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (
        !touchMoved.current &&
        e.changedTouches.length === 1 &&
        Date.now() - touchStartTime.current < 300
      ) {
        // 주석 모드에서의 탭 처리
        if (onAnnotationTap) {
          onAnnotationTap(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY,
          );
        } else {
          handleTouchTap(
            e.changedTouches[0].clientX,
            e.changedTouches[0].clientY,
          );
        }
      }

      isTouching.current = false;
      lastPinchDist.current = null;
      touchMoved.current = false;
    },
    [handleTouchTap, onAnnotationTap],
  );

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
