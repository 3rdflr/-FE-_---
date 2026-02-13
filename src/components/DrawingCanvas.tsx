import React, { useRef, useEffect, useState } from "react";
import { useDrawingStore } from "../store/useDrawingStore";
import { CanvasRenderer, resizeCanvas } from "../utils/canvasRenderer";
import { useCanvasMouseEvents } from "../hooks/useCanvasMouseEvents";
import { useCanvasTouchEvents } from "../hooks/useCanvasTouchEvents";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { ZoomControls } from "./ZoomControls";

interface RenderState {
  baseImageX: number;
  baseImageY: number;
  baseImageScale: number;
  baseImage: HTMLImageElement | null;
}

export const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<CanvasRenderer | null>(null);
  const [renderState, setRenderState] = useState<RenderState>({
    baseImageX: 0,
    baseImageY: 0,
    baseImageScale: 1,
    baseImage: null,
  });
  const [renderTrigger, setRenderTrigger] = useState(0);

  const {
    metadata,
    getCurrentDrawing,
    getCurrentDisciplineData,
    getCurrentRevisionData,
    loadImage,
    layers,
    currentDrawingId,
    selectDrawing,
    viewport,
    setViewport,
    resetViewport,
    zoomIn,
    zoomOut,
    setCanvasSize,
    selectedLayer,
    setLayerOffset,
    setDraggingLayer,
  } = useDrawingStore();

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = resizeCanvas(canvas);
    setCanvasSize(width, height);
    setRenderer(new CanvasRenderer(ctx));

    const handleResize = () => {
      const { width, height } = resizeCanvas(canvas);
      setCanvasSize(width, height);
      setRenderTrigger((prev) => prev + 1);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setCanvasSize]);

  // 마우스 이벤트
  const {
    hoveredBuilding,
    isDraggingLayer,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  } = useCanvasMouseEvents({
    canvasRef,
    viewport,
    selectedLayer,
    layers,
    currentDrawingId,
    metadata,
    renderState,
    renderer,
    setViewport,
    setLayerOffset,
    setDraggingLayer,
    selectDrawing,
  });

  // 터치 이벤트
  const { handleTouchStart, handleTouchMove, handleTouchEnd } =
    useCanvasTouchEvents({
      canvasRef,
      viewport,
      currentDrawingId,
      metadata,
      renderState,
      renderer,
      setViewport,
      selectDrawing,
    });

  // 이벤트 리스너 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // 렌더링
  useCanvasRenderer({
    canvasRef,
    renderer,
    metadata,
    layers,
    viewport,
    hoveredBuilding,
    selectedLayer,
    renderTrigger,
    getCurrentDrawing,
    getCurrentDisciplineData,
    getCurrentRevisionData,
    loadImage,
    setRenderState,
  });

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: selectedLayer ? "crosshair" : "grab" }}
      />

      <ZoomControls
        zoom={viewport.zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetViewport}
      />

      {selectedLayer && (
        <div
          className={`absolute bottom-4 left-4 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm shadow-lg transition-colors ${
            isDraggingLayer
              ? "bg-green-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <span className="font-medium">{selectedLayer}</span>
          {isDraggingLayer ? (
            <span className="ml-2">드래그 중...</span>
          ) : (
            <span className="ml-2 opacity-80">
              <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                Shift
              </kbd>{" "}
              + 드래그로 이동
            </span>
          )}
        </div>
      )}
    </div>
  );
};
