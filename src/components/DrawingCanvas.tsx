import React, { useRef, useEffect, useState, useCallback } from "react";
import { useDrawingStore } from "../store/useDrawingStore";
import { CanvasRenderer, resizeCanvas } from "../utils/canvasRenderer";

interface RenderState {
  baseImageX: number;
  baseImageY: number;
  baseImageScale: number;
  baseImage: HTMLImageElement | null;
}

export const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<CanvasRenderer | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [renderState, setRenderState] = useState<RenderState>({
    baseImageX: 0,
    baseImageY: 0,
    baseImageScale: 1,
    baseImage: null,
  });

  // 리사이즈 후 캔버스 재렌더링을 트리거하기 위한 카운터
  const [renderTrigger, setRenderTrigger] = useState(0);

  // 드래그 상태를 state로 관리 (ref는 리렌더링을 트리거하지 않음)
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const isDraggingCanvas = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentDraggingLayerRef = useRef<string | null>(null);

  // 터치 상태
  const isTouching = useRef(false);
  const lastTouchPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const touchStartTime = useRef(0);
  const touchMoved = useRef(false);

  const {
    metadata,
    getCurrentDrawing,
    getCurrentDisciplineData,
    getCurrentRevisionData,
    loadImage,
    layers,
    currentDiscipline,
    currentRegion,
    currentRevision,
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

  // 휠 줌
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * delta));

      const zoomChange = newZoom / viewport.zoom;
      const newOffsetX = mouseX - (mouseX - viewport.offsetX) * zoomChange;
      const newOffsetY = mouseY - (mouseY - viewport.offsetY) * zoomChange;

      setViewport({
        zoom: newZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY,
      });
    },
    [viewport, setViewport],
  );

  // 마우스 다운
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Shift 키 + 선택된 레이어가 있으면 레이어 드래그 시작
      if (e.shiftKey && selectedLayer) {
        const layer = layers.find((l) => l.discipline === selectedLayer);

        if (layer && !layer.locked && layer.visible) {
          setIsDraggingLayer(true);
          currentDraggingLayerRef.current = selectedLayer;
          setDraggingLayer(selectedLayer);
          lastMousePos.current = { x: mouseX, y: mouseY };
          canvas.style.cursor = "move";
          return;
        }
      }

      // 일반 캔버스 팬
      isDraggingCanvas.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    },
    [selectedLayer, layers, setDraggingLayer],
  );

  // 마우스 이동
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 레이어 드래그 중
      if (isDraggingLayer && currentDraggingLayerRef.current) {
        e.preventDefault();

        const dx = (mouseX - lastMousePos.current.x) / viewport.zoom;
        const dy = (mouseY - lastMousePos.current.y) / viewport.zoom;

        const layerName = currentDraggingLayerRef.current;
        const layer = layers.find((l) => l.discipline === layerName);

        if (layer) {
          setLayerOffset(layerName, layer.offsetX + dx, layer.offsetY + dy);
        }

        lastMousePos.current = { x: mouseX, y: mouseY };
        return;
      }

      // 캔버스 팬 중
      if (isDraggingCanvas.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;

        setViewport({
          offsetX: viewport.offsetX + dx,
          offsetY: viewport.offsetY + dy,
        });

        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Hotspot 호버 체크 (배치도일 때만)
      if (currentDrawingId === "00" && metadata && renderState.baseImage) {
        const buildings = Object.values(metadata.drawings).filter(
          (d) => d.parent === "00",
        );

        let found = false;
        for (const building of buildings) {
          if (!building.position?.vertices) continue;

          const isInside = renderer?.isPointInHotspot(
            mouseX,
            mouseY,
            building.position.vertices,
            renderState.baseImageX,
            renderState.baseImageY,
            renderState.baseImageScale,
            viewport.offsetX,
            viewport.offsetY,
            viewport.zoom,
          );

          if (isInside) {
            setHoveredBuilding(building.id);
            canvas.style.cursor = "pointer";
            found = true;
            break;
          }
        }

        if (!found) {
          setHoveredBuilding(null);
          if (!isDraggingLayer) {
            canvas.style.cursor = selectedLayer ? "crosshair" : "grab";
          }
        }
      } else {
        // 배치도가 아닐 때 커서 설정
        if (!isDraggingLayer && !isDraggingCanvas.current) {
          canvas.style.cursor = selectedLayer ? "crosshair" : "grab";
        }
      }
    },
    [
      isDraggingLayer,
      layers,
      viewport,
      setViewport,
      setLayerOffset,
      currentDrawingId,
      metadata,
      renderState,
      renderer,
      selectedLayer,
    ],
  );

  // 마우스 업
  const handleMouseUp = useCallback(() => {
    const canvas = canvasRef.current;

    isDraggingCanvas.current = false;
    setIsDraggingLayer(false);
    currentDraggingLayerRef.current = null;
    setDraggingLayer(null);

    if (canvas) {
      canvas.style.cursor = hoveredBuilding
        ? "pointer"
        : selectedLayer
          ? "crosshair"
          : "grab";
    }
  }, [hoveredBuilding, selectedLayer, setDraggingLayer]);

  // 클릭 (Hotspot 선택)
  const handleClick = useCallback(
    async (e: MouseEvent) => {
      // 드래그 중이었으면 클릭 무시
      if (isDraggingLayer) return;

      if (currentDrawingId !== "00" || !metadata || !renderState.baseImage)
        return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const buildings = Object.values(metadata.drawings).filter(
        (d) => d.parent === "00",
      );

      for (const building of buildings) {
        if (!building.position?.vertices) continue;

        const isInside = renderer?.isPointInHotspot(
          mouseX,
          mouseY,
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
    [
      currentDrawingId,
      metadata,
      renderState,
      viewport,
      renderer,
      selectDrawing,
      isDraggingLayer,
    ],
  );

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
    [currentDrawingId, metadata, renderState, viewport, renderer, selectDrawing],
  );

  // 터치 시작
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1) {
        // 싱글 터치 → 팬 (탭 판별용 시작 정보 기록)
        isTouching.current = true;
        touchMoved.current = false;
        touchStartTime.current = Date.now();
        lastPinchDist.current = null;
        const pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastTouchPos.current = pos;
        touchStartPos.current = pos;
      } else if (e.touches.length === 2) {
        // 투 핑거 → 핀치 줌 준비 (탭 취소)
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

        // 이동 거리가 8px 이상이면 드래그로 판정
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
        // 핀치 줌
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
    [viewport, setViewport],
  );

  // 터치 종료 - 탭 판별
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      // 싱글 터치가 끝났고, 이동 없이 짧은 시간(300ms 이내)이면 탭으로 처리
      if (
        !touchMoved.current &&
        e.changedTouches.length === 1 &&
        Date.now() - touchStartTime.current < 300
      ) {
        handleTouchTap(
          e.changedTouches[0].clientX,
          e.changedTouches[0].clientY,
        );
      }

      isTouching.current = false;
      lastPinchDist.current = null;
      touchMoved.current = false;
    },
    [handleTouchTap],
  );

  // 이벤트 리스너 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // passive: false로 설정해야 preventDefault가 동작
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    // window에 등록해야 캔버스 밖에서도 드래그가 계속됨
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleClick);

    // 터치 이벤트
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
  useEffect(() => {
    if (!renderer || !metadata) return;

    const drawing = getCurrentDrawing();
    const disciplineData = getCurrentDisciplineData();
    const revisionData = getCurrentRevisionData();

    if (!drawing) return;

    const render = async () => {
      renderer.clear();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Viewport 적용
      renderer.setViewport(viewport.offsetX, viewport.offsetY, viewport.zoom);

      // 기준 도면 결정
      let baseImagePath: string;
      if (drawing.id === "00") {
        baseImagePath = drawing.image;
      } else if (revisionData?.image) {
        baseImagePath = revisionData.image;
      } else if (disciplineData?.image) {
        baseImagePath = disciplineData.image;
      } else {
        baseImagePath = drawing.image;
      }

      try {
        const baseImage = await loadImage(baseImagePath);

        // 화면에 맞는 스케일 계산 (80% 영역 사용)
        const fitScale = Math.min(
          (rect.width * 0.8) / baseImage.width,
          (rect.height * 0.8) / baseImage.height,
        );

        // 이미지 좌상단 좌표 계산
        const imageX = centerX - (baseImage.width * fitScale) / 2;
        const imageY = centerY - (baseImage.height * fitScale) / 2;

        // 렌더 상태 저장 (Hotspot 계산용)
        setRenderState({
          baseImageX: imageX,
          baseImageY: imageY,
          baseImageScale: fitScale,
          baseImage,
        });

        // 기준 도면 렌더링
        renderer.drawImageCentered(baseImage, centerX, centerY, fitScale);

        // 배치도인 경우 Hotspot 표시
        if (drawing.id === "00") {
          const buildings = Object.values(metadata.drawings).filter(
            (d) => d.parent === "00",
          );

          for (const building of buildings) {
            if (!building.position?.vertices) continue;

            renderer.drawHotspotOnImage(
              building.position.vertices,
              imageX,
              imageY,
              fitScale,
              hoveredBuilding === building.id,
              building.name,
            );
          }
        }

        // 오버레이 레이어 그리기 (zIndex 순으로 정렬)
        const sortedLayers = [...layers]
          .filter((l) => l.visible)
          .sort((a, b) => a.zIndex - b.zIndex);

        for (const layer of sortedLayers) {
          const layerDiscipline = drawing.disciplines?.[layer.discipline];
          if (!layerDiscipline) continue;

          let layerImagePath: string | null = null;

          // 리비전 이미지 또는 기본 이미지
          if (
            layerDiscipline.revisions &&
            layerDiscipline.revisions.length > 0
          ) {
            layerImagePath = layerDiscipline.revisions[0].image;
          } else if (layerDiscipline.image) {
            layerImagePath = layerDiscipline.image;
          }

          if (!layerImagePath) continue;

          try {
            const layerImage = await loadImage(layerImagePath);

            // 레이어를 같은 중앙점에 그리되, 개별 오프셋 적용
            renderer.drawImageCentered(
              layerImage,
              centerX,
              centerY,
              fitScale,
              layer.offsetX,
              layer.offsetY,
              layer.opacity / 100,
            );

            // 선택된 레이어 테두리 표시
            if (layer.discipline === selectedLayer) {
              const ctx = renderer.getContext();
              ctx.save();
              ctx.strokeStyle = "#3b82f6";
              ctx.lineWidth = 3;
              ctx.setLineDash([8, 4]);
              ctx.strokeRect(
                centerX + layer.offsetX - (layerImage.width * fitScale) / 2 - 4,
                centerY +
                  layer.offsetY -
                  (layerImage.height * fitScale) / 2 -
                  4,
                layerImage.width * fitScale + 8,
                layerImage.height * fitScale + 8,
              );
              ctx.restore();
            }
          } catch (error) {
            console.error("Failed to load layer image:", layerImagePath, error);
          }
        }

        renderer.resetViewport();
      } catch (error) {
        console.error("Failed to load base image:", baseImagePath, error);
        renderer.resetViewport();
      }
    };

    render();
  }, [
    renderer,
    metadata,
    getCurrentDrawing,
    getCurrentDisciplineData,
    getCurrentRevisionData,
    layers,
    currentDiscipline,
    currentRegion,
    currentRevision,
    viewport,
    hoveredBuilding,
    loadImage,
    selectedLayer,
    renderTrigger,
  ]);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ cursor: selectedLayer ? "crosshair" : "grab" }}
      />

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={zoomIn}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          title="확대"
        >
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v12m6-6H6"
            />
          </svg>
        </button>
        <button
          onClick={resetViewport}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
          title="100%로 리셋"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button
          onClick={zoomOut}
          className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          title="축소"
        >
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 12H6"
            />
          </svg>
        </button>
      </div>

      {/* 레이어 드래그 안내 */}
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
