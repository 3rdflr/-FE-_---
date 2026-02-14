import React, { useRef, useEffect, useState, useMemo } from "react";
import { useDrawingStore } from "../store/useDrawingStore";
import { useAnnotationStore } from "../store/useAnnotationStore";
import { CanvasRenderer, resizeCanvas } from "../utils/canvasRenderer";
import { useCanvasMouseEvents } from "../hooks/useCanvasMouseEvents";
import { useCanvasTouchEvents } from "../hooks/useCanvasTouchEvents";
import { useCanvasRenderer } from "../hooks/useCanvasRenderer";
import { useAnnotations } from "../hooks/useAnnotations";
import { ZoomControls } from "./ZoomControls";
import { AnnotationToolbar } from "./AnnotationToolbar";
import { ExportButton } from "./ExportButton";
import { TextInputModal } from "./TextInputModal";

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
    currentDiscipline,
    currentRevision,
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

  // 주석 스토어 - 모든 주석 가져오기
  const allAnnotations = useAnnotationStore((state) => state.annotations);

  // 현재 도면의 주석만 필터링 (메모이제이션)
  const annotations = useMemo(() => {
    if (!currentDrawingId) return [];
    return allAnnotations.filter(
      (ann) =>
        ann.drawingId === currentDrawingId &&
        ann.discipline === currentDiscipline &&
        ann.revision === currentRevision,
    );
  }, [allAnnotations, currentDrawingId, currentDiscipline, currentRevision]);

  // 주석 이벤트 핸들러
  const {
    isAnnotationMode,
    currentTool,
    handleAnnotationClick,
    handleShapeStart,
    handleShapeMove,
    handleShapeEnd,
    handleTouchAnnotationStart,
    handleTouchAnnotationMove,
    handleTouchAnnotationEnd,
    handleTouchAnnotationTap,
    previewShape,
    isTextModalOpen,
    textModalPosition,
    handleTextSubmit,
    handleTextModalClose,
  } = useAnnotations({
    canvasRef,
    currentDrawingId,
    currentDiscipline,
    currentRevision,
    viewport,
  });

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
      onAnnotationTap: isAnnotationMode && currentTool === "text" ? handleTouchAnnotationTap : undefined,
    });

  // 이벤트 리스너 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 통합 이벤트 핸들러
    const handleCanvasMouseDown = (e: MouseEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleShapeStart(e);
      } else {
        handleMouseDown(e);
      }
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleShapeMove(e);
      } else {
        handleMouseMove(e);
      }
    };

    const handleCanvasMouseUp = (e: MouseEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleShapeEnd(e);
      } else {
        handleMouseUp();
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (isAnnotationMode && currentTool === "text") {
        handleAnnotationClick(e);
      } else if (!isAnnotationMode) {
        handleClick(e);
      }
    };

    // 터치 이벤트 통합 핸들러
    const handleCanvasTouchStart = (e: TouchEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleTouchAnnotationStart(e);
      } else {
        handleTouchStart(e);
      }
    };

    const handleCanvasTouchMove = (e: TouchEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleTouchAnnotationMove(e);
      } else {
        handleTouchMove(e);
      }
    };

    const handleCanvasTouchEnd = (e: TouchEvent) => {
      if (isAnnotationMode && currentTool && currentTool !== "text") {
        handleTouchAnnotationEnd(e);
      } else {
        handleTouchEnd(e);
      }
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleCanvasMouseDown);
    window.addEventListener("mousemove", handleCanvasMouseMove);
    window.addEventListener("mouseup", handleCanvasMouseUp);
    canvas.addEventListener("click", handleCanvasClick);

    canvas.addEventListener("touchstart", handleCanvasTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleCanvasTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleCanvasTouchEnd);

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleCanvasMouseDown);
      window.removeEventListener("mousemove", handleCanvasMouseMove);
      window.removeEventListener("mouseup", handleCanvasMouseUp);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("touchstart", handleCanvasTouchStart);
      canvas.removeEventListener("touchmove", handleCanvasTouchMove);
      canvas.removeEventListener("touchend", handleCanvasTouchEnd);
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
    isAnnotationMode,
    currentTool,
    handleAnnotationClick,
    handleShapeStart,
    handleShapeMove,
    handleShapeEnd,
    handleTouchAnnotationStart,
    handleTouchAnnotationMove,
    handleTouchAnnotationEnd,
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
    annotations,
    previewShape,
  });

  const drawing = getCurrentDrawing();
  const filename = drawing
    ? `${drawing.name}_${currentDiscipline || ""}_${currentRevision || ""}.png`
    : "drawing.png";

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          cursor: isAnnotationMode
            ? currentTool === "text"
              ? "text"
              : "crosshair"
            : selectedLayer
              ? "crosshair"
              : "grab",
        }}
      />

      {/* 주석 도구 바 */}
      <AnnotationToolbar />

      {/* 줌 컨트롤 & 내보내기 버튼 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <ExportButton canvasRef={canvasRef} filename={filename} />
        <ZoomControls
          zoom={viewport.zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetViewport}
        />
      </div>

      {selectedLayer && !isAnnotationMode && (
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

      {/* 주석 모드 안내 */}
      {isAnnotationMode && currentTool && (
        <div className="absolute bottom-4 left-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm shadow-lg">
          <span className="font-medium">
            {currentTool === "text" && "클릭하여 텍스트 추가"}
            {currentTool === "arrow" && "드래그하여 화살표 그리기"}
            {currentTool === "rectangle" && "드래그하여 사각형 그리기"}
            {currentTool === "circle" && "드래그하여 원 그리기"}
          </span>
        </div>
      )}

      {/* 텍스트 입력 모달 */}
      <TextInputModal
        isOpen={isTextModalOpen}
        onClose={handleTextModalClose}
        onSubmit={handleTextSubmit}
        position={textModalPosition}
      />
    </div>
  );
};
