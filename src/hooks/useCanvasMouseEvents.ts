import { useCallback, useRef, useState } from "react";
import { Metadata } from "../types/metadata";
import { CanvasRenderer } from "../utils/canvasRenderer";
import { Layer } from "../store/useDrawingStore";

interface RenderState {
  baseImageX: number;
  baseImageY: number;
  baseImageScale: number;
  baseImage: HTMLImageElement | null;
}

interface UseCanvasMouseEventsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  viewport: { zoom: number; offsetX: number; offsetY: number };
  selectedLayer: string | null;
  layers: Layer[];
  currentDrawingId: string | null;
  metadata: Metadata | null;
  renderState: RenderState;
  renderer: CanvasRenderer | null;
  setViewport: (viewport: Partial<{ zoom: number; offsetX: number; offsetY: number }>) => void;
  setLayerOffset: (discipline: string, offsetX: number, offsetY: number) => void;
  setDraggingLayer: (discipline: string | null) => void;
  selectDrawing: (drawingId: string) => void;
}

export const useCanvasMouseEvents = ({
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
}: UseCanvasMouseEventsProps) => {
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [isDraggingLayer, setIsDraggingLayer] = useState(false);
  const isDraggingCanvas = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const currentDraggingLayerRef = useRef<string | null>(null);

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
    [viewport, setViewport, canvasRef],
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

      isDraggingCanvas.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    },
    [selectedLayer, layers, setDraggingLayer, canvasRef],
  );

  // 마우스 이동
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

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
      canvasRef,
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
  }, [hoveredBuilding, selectedLayer, setDraggingLayer, canvasRef]);

  // 클릭 (Hotspot 선택)
  const handleClick = useCallback(
    async (e: MouseEvent) => {
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
      canvasRef,
    ],
  );

  return {
    hoveredBuilding,
    isDraggingLayer,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
  };
};
