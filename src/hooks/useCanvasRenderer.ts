import { useEffect } from "react";
import { Metadata } from "../types/metadata";
import { CanvasRenderer } from "../utils/canvasRenderer";
import { Layer } from "../store/useDrawingStore";
import type { Annotation } from "../types/annotation";

interface RenderState {
  baseImageX: number;
  baseImageY: number;
  baseImageScale: number;
  baseImage: HTMLImageElement | null;
}

interface UseCanvasRendererProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  renderer: CanvasRenderer | null;
  metadata: Metadata | null;
  layers: Layer[];
  viewport: { zoom: number; offsetX: number; offsetY: number };
  hoveredBuilding: string | null;
  selectedLayer: string | null;
  renderTrigger: number;
  getCurrentDrawing: () => any;
  getCurrentDisciplineData: () => any;
  getCurrentRevisionData: () => any;
  loadImage: (path: string) => Promise<HTMLImageElement>;
  setRenderState: (state: RenderState) => void;
  annotations?: Annotation[];
  previewShape?: { x: number; y: number; endX: number; endY: number; type: "arrow" | "rectangle" | "circle" } | null;
}

export const useCanvasRenderer = ({
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
  annotations = [],
  previewShape = null,
}: UseCanvasRendererProps) => {
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

      renderer.setViewport(viewport.offsetX, viewport.offsetY, viewport.zoom);

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

        const fitScale = Math.min(
          (rect.width * 0.8) / baseImage.width,
          (rect.height * 0.8) / baseImage.height,
        );

        const imageX = centerX - (baseImage.width * fitScale) / 2;
        const imageY = centerY - (baseImage.height * fitScale) / 2;

        setRenderState({
          baseImageX: imageX,
          baseImageY: imageY,
          baseImageScale: fitScale,
          baseImage,
        });

        renderer.drawImageCentered(baseImage, centerX, centerY, fitScale);

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

        const sortedLayers = [...layers]
          .filter((l) => l.visible)
          .sort((a, b) => a.zIndex - b.zIndex);

        for (const layer of sortedLayers) {
          const layerDiscipline = drawing.disciplines?.[layer.discipline];
          if (!layerDiscipline) continue;

          let layerImagePath: string | null = null;

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

            renderer.drawImageCentered(
              layerImage,
              centerX,
              centerY,
              fitScale,
              layer.offsetX,
              layer.offsetY,
              layer.opacity / 100,
            );

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

        // 주석 렌더링
        if (annotations.length > 0) {
          for (const annotation of annotations) {
            renderer.drawAnnotation(annotation);
          }
        }

        // 미리보기 도형 그리기 (드래그 중)
        if (previewShape) {
          const ctx = renderer.getContext();
          ctx.save();
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;

          const width = previewShape.endX - previewShape.x;
          const height = previewShape.endY - previewShape.y;

          if (previewShape.type === "rectangle") {
            // 사각형: 점선
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.rect(previewShape.x, previewShape.y, width, height);
            ctx.stroke();
          } else if (previewShape.type === "circle") {
            // 원: 실선 타원
            const centerX = previewShape.x + width / 2;
            const centerY = previewShape.y + height / 2;
            const radiusX = Math.abs(width) / 2;
            const radiusY = Math.abs(height) / 2;

            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (previewShape.type === "arrow") {
            // 화살표: 실선 화살표
            ctx.beginPath();
            ctx.moveTo(previewShape.x, previewShape.y);
            ctx.lineTo(previewShape.endX, previewShape.endY);
            ctx.stroke();

            // 화살표 머리
            const angle = Math.atan2(
              previewShape.endY - previewShape.y,
              previewShape.endX - previewShape.x
            );
            const headLength = 15;

            ctx.beginPath();
            ctx.moveTo(previewShape.endX, previewShape.endY);
            ctx.lineTo(
              previewShape.endX - headLength * Math.cos(angle - Math.PI / 6),
              previewShape.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(previewShape.endX, previewShape.endY);
            ctx.lineTo(
              previewShape.endX - headLength * Math.cos(angle + Math.PI / 6),
              previewShape.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }

          ctx.restore();
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
    viewport,
    hoveredBuilding,
    loadImage,
    selectedLayer,
    renderTrigger,
    canvasRef,
    setRenderState,
    annotations,
    previewShape,
  ]);
};
