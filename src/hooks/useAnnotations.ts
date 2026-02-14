import { useCallback, useRef, useState, useEffect } from "react";
import { useAnnotationStore } from "../store/useAnnotationStore";
import type { Annotation, TextAnnotationData, ArrowAnnotationData, ShapeAnnotationData } from "../types/annotation";

interface UseAnnotationsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  currentDrawingId: string | null;
  currentDiscipline: string | null;
  currentRevision: string | null;
  viewport: { zoom: number; offsetX: number; offsetY: number };
}

export const useAnnotations = ({
  canvasRef,
  currentDrawingId,
  currentDiscipline,
  currentRevision,
  viewport,
}: UseAnnotationsProps) => {
  const {
    isAnnotationMode,
    currentTool,
    textSettings,
    arrowSettings,
    shapeSettings,
    addAnnotation,
    deleteAnnotation,
  } = useAnnotationStore();

  const isDrawingRef = useRef(false);
  const drawStartPos = useRef<{ x: number; y: number } | null>(null);
  const [previewShape, setPreviewShape] = useState<{
    x: number;
    y: number;
    endX: number;
    endY: number;
    type: "arrow" | "rectangle" | "circle";
  } | null>(null);

  // 텍스트 입력 모달 상태
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textModalPosition, setTextModalPosition] = useState({ x: 0, y: 0 });
  const pendingTextPosition = useRef<{ x: number; y: number } | null>(null);

  // 주석 삭제 모달 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [annotationToDelete, setAnnotationToDelete] = useState<string | null>(null);

  // viewport, settings를 ref로 저장하여 콜백이 재생성되지 않도록 함
  const viewportRef = useRef(viewport);
  const textSettingsRef = useRef(textSettings);
  const arrowSettingsRef = useRef(arrowSettings);
  const shapeSettingsRef = useRef(shapeSettings);
  const currentDrawingIdRef = useRef(currentDrawingId);
  const currentDisciplineRef = useRef(currentDiscipline);
  const currentRevisionRef = useRef(currentRevision);
  const isAnnotationModeRef = useRef(isAnnotationMode);
  const currentToolRef = useRef(currentTool);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    textSettingsRef.current = textSettings;
  }, [textSettings]);

  useEffect(() => {
    arrowSettingsRef.current = arrowSettings;
  }, [arrowSettings]);

  useEffect(() => {
    shapeSettingsRef.current = shapeSettings;
  }, [shapeSettings]);

  useEffect(() => {
    currentDrawingIdRef.current = currentDrawingId;
  }, [currentDrawingId]);

  useEffect(() => {
    currentDisciplineRef.current = currentDiscipline;
  }, [currentDiscipline]);

  useEffect(() => {
    currentRevisionRef.current = currentRevision;
  }, [currentRevision]);

  useEffect(() => {
    isAnnotationModeRef.current = isAnnotationMode;
  }, [isAnnotationMode]);

  useEffect(() => {
    currentToolRef.current = currentTool;
  }, [currentTool]);

  // 캔버스 좌표를 실제 좌표로 변환
  const canvasToRealCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;

      // viewport 변환 역적용 (ref 사용)
      const realX = (canvasX - viewportRef.current.offsetX) / viewportRef.current.zoom;
      const realY = (canvasY - viewportRef.current.offsetY) / viewportRef.current.zoom;

      return { x: realX, y: realY };
    },
    [canvasRef]
  );

  // 주석 추가 핸들러
  const handleAnnotationClick = useCallback(
    (e: MouseEvent) => {
      if (!isAnnotationModeRef.current || !currentToolRef.current || !currentDrawingIdRef.current) return;

      const { x, y } = canvasToRealCoords(e.clientX, e.clientY);

      // 텍스트 주석: 모달 표시
      if (currentToolRef.current === "text") {
        // 모달은 화면 중앙에 고정 (위치는 더미 값)
        setTextModalPosition({ x: 0, y: 0 });
        pendingTextPosition.current = { x, y };
        setIsTextModalOpen(true);
      }
    },
    [canvasToRealCoords]
  );

  // 텍스트 모달 제출 핸들러
  const handleTextSubmit = useCallback(
    (text: string) => {
      if (!pendingTextPosition.current || !currentDrawingIdRef.current) return;

      const data: TextAnnotationData = {
        text,
        fontSize: textSettingsRef.current.fontSize,
        color: textSettingsRef.current.color,
        backgroundColor: textSettingsRef.current.backgroundColor,
      };

      addAnnotation({
        type: "text",
        drawingId: currentDrawingIdRef.current,
        discipline: currentDisciplineRef.current,
        revision: currentRevisionRef.current,
        x: pendingTextPosition.current.x,
        y: pendingTextPosition.current.y,
        data,
      });

      pendingTextPosition.current = null;
    },
    [addAnnotation]
  );

  // 텍스트 모달 닫기 핸들러
  const handleTextModalClose = useCallback(() => {
    setIsTextModalOpen(false);
    pendingTextPosition.current = null;
  }, []);

  // 화살표/도형 드래그 시작
  const handleShapeStart = useCallback(
    (e: MouseEvent) => {
      if (!isAnnotationModeRef.current || !currentToolRef.current || currentToolRef.current === "text") return;
      if (!currentDrawingIdRef.current) return;

      const { x, y } = canvasToRealCoords(e.clientX, e.clientY);
      isDrawingRef.current = true;
      drawStartPos.current = { x, y };
      setPreviewShape({
        x,
        y,
        endX: x,
        endY: y,
        type: currentToolRef.current as "arrow" | "rectangle" | "circle"
      });
    },
    [canvasToRealCoords]
  );

  // 화살표/도형 드래그 중
  const handleShapeMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingRef.current || !drawStartPos.current) return;

      const { x, y } = canvasToRealCoords(e.clientX, e.clientY);
      setPreviewShape({
        x: drawStartPos.current.x,
        y: drawStartPos.current.y,
        endX: x,
        endY: y,
        type: currentToolRef.current as "arrow" | "rectangle" | "circle"
      });
    },
    [canvasToRealCoords]
  );

  // 화살표/도형 드래그 완료
  const handleShapeEnd = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingRef.current || !drawStartPos.current || !currentDrawingIdRef.current) return;
      if (!currentToolRef.current || currentToolRef.current === "text") return;

      const { x, y } = canvasToRealCoords(e.clientX, e.clientY);
      const startX = drawStartPos.current.x;
      const startY = drawStartPos.current.y;

      // 최소 크기 체크
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      if (dx < 5 && dy < 5) {
        isDrawingRef.current = false;
        setPreviewShape(null);
        drawStartPos.current = null;
        return;
      }

      if (currentToolRef.current === "arrow") {
        const data: ArrowAnnotationData = {
          endX: x,
          endY: y,
          color: arrowSettingsRef.current.color,
          lineWidth: arrowSettingsRef.current.lineWidth,
        };

        addAnnotation({
          type: "arrow",
          drawingId: currentDrawingIdRef.current,
          discipline: currentDisciplineRef.current,
          revision: currentRevisionRef.current,
          x: startX,
          y: startY,
          data,
        });
      } else if (currentToolRef.current === "rectangle" || currentToolRef.current === "circle") {
        const width = x - startX;
        const height = y - startY;

        const data: ShapeAnnotationData = {
          width,
          height,
          color: shapeSettingsRef.current.color,
          lineWidth: shapeSettingsRef.current.lineWidth,
          fill: shapeSettingsRef.current.fill,
        };

        addAnnotation({
          type: currentToolRef.current,
          drawingId: currentDrawingIdRef.current,
          discipline: currentDisciplineRef.current,
          revision: currentRevisionRef.current,
          x: startX,
          y: startY,
          data,
        });
      }

      isDrawingRef.current = false;
      setPreviewShape(null);
      drawStartPos.current = null;
    },
    [canvasToRealCoords, addAnnotation]
  );

  // 터치 이벤트 핸들러
  const handleTouchAnnotationStart = useCallback(
    (e: TouchEvent) => {
      if (!isAnnotationModeRef.current || !currentToolRef.current || currentToolRef.current === "text") return;
      if (!currentDrawingIdRef.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const { x, y } = canvasToRealCoords(touch.clientX, touch.clientY);
      isDrawingRef.current = true;
      drawStartPos.current = { x, y };
      setPreviewShape({
        x,
        y,
        endX: x,
        endY: y,
        type: currentToolRef.current as "arrow" | "rectangle" | "circle"
      });
    },
    [canvasToRealCoords]
  );

  const handleTouchAnnotationMove = useCallback(
    (e: TouchEvent) => {
      if (!isDrawingRef.current || !drawStartPos.current || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const { x, y } = canvasToRealCoords(touch.clientX, touch.clientY);
      setPreviewShape({
        x: drawStartPos.current.x,
        y: drawStartPos.current.y,
        endX: x,
        endY: y,
        type: currentToolRef.current as "arrow" | "rectangle" | "circle"
      });
    },
    [canvasToRealCoords]
  );

  const handleTouchAnnotationEnd = useCallback(
    (e: TouchEvent) => {
      if (!isDrawingRef.current || !drawStartPos.current || !currentDrawingIdRef.current) return;
      if (!currentToolRef.current || currentToolRef.current === "text") return;
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];
      const { x, y } = canvasToRealCoords(touch.clientX, touch.clientY);
      const startX = drawStartPos.current.x;
      const startY = drawStartPos.current.y;

      // 최소 크기 체크
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      if (dx < 5 && dy < 5) {
        isDrawingRef.current = false;
        setPreviewShape(null);
        drawStartPos.current = null;
        return;
      }

      if (currentToolRef.current === "arrow") {
        const data: ArrowAnnotationData = {
          endX: x,
          endY: y,
          color: arrowSettingsRef.current.color,
          lineWidth: arrowSettingsRef.current.lineWidth,
        };

        addAnnotation({
          type: "arrow",
          drawingId: currentDrawingIdRef.current,
          discipline: currentDisciplineRef.current,
          revision: currentRevisionRef.current,
          x: startX,
          y: startY,
          data,
        });
      } else if (currentToolRef.current === "rectangle" || currentToolRef.current === "circle") {
        const width = x - startX;
        const height = y - startY;

        const data: ShapeAnnotationData = {
          width,
          height,
          color: shapeSettingsRef.current.color,
          lineWidth: shapeSettingsRef.current.lineWidth,
          fill: shapeSettingsRef.current.fill,
        };

        addAnnotation({
          type: currentToolRef.current,
          drawingId: currentDrawingIdRef.current,
          discipline: currentDisciplineRef.current,
          revision: currentRevisionRef.current,
          x: startX,
          y: startY,
          data,
        });
      }

      isDrawingRef.current = false;
      setPreviewShape(null);
      drawStartPos.current = null;
    },
    [canvasToRealCoords, addAnnotation]
  );

  const handleTouchAnnotationTap = useCallback(
    (clientX: number, clientY: number) => {
      if (!isAnnotationModeRef.current || !currentToolRef.current || !currentDrawingIdRef.current) return;

      const { x, y } = canvasToRealCoords(clientX, clientY);

      // 텍스트 주석: 모달 표시
      if (currentToolRef.current === "text") {
        // 모달은 화면 중앙에 고정 (위치는 더미 값)
        setTextModalPosition({ x: 0, y: 0 });
        pendingTextPosition.current = { x, y };
        setIsTextModalOpen(true);
      }
    },
    [canvasToRealCoords]
  );

  // 주석 클릭 여부 확인 (주석 위에 클릭했는지)
  const checkAnnotationClick = useCallback(
    (x: number, y: number, annotations: Annotation[]): Annotation | null => {
      // 역순으로 체크 (나중에 그려진 주석이 우선)
      for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];

        switch (ann.type) {
          case "text": {
            const data = ann.data as TextAnnotationData;
            // 간단한 바운딩 박스 체크
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) continue;
            ctx.font = `${data.fontSize}px sans-serif`;
            const metrics = ctx.measureText(data.text);
            const padding = 4;

            if (
              x >= ann.x - padding &&
              x <= ann.x + metrics.width + padding &&
              y >= ann.y - padding &&
              y <= ann.y + data.fontSize + padding
            ) {
              return ann;
            }
            break;
          }

          case "arrow": {
            const data = ann.data as ArrowAnnotationData;
            // 화살표 선 근처 클릭 체크 (10px 오차 허용)
            const tolerance = 10;
            const dist = pointToLineDistance(x, y, ann.x, ann.y, data.endX, data.endY);
            if (dist < tolerance) {
              return ann;
            }
            break;
          }

          case "rectangle":
          case "circle": {
            const data = ann.data as ShapeAnnotationData;
            // 사각형/원 영역 내부 클릭 체크
            if (
              x >= ann.x &&
              x <= ann.x + data.width &&
              y >= ann.y &&
              y <= ann.y + data.height
            ) {
              return ann;
            }
            break;
          }
        }
      }
      return null;
    },
    [canvasRef]
  );

  // 점과 선분 사이의 거리 계산
  const pointToLineDistance = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 주석 클릭하여 삭제 요청
  const handleAnnotationClickForDelete = useCallback(
    (clientX: number, clientY: number, annotations: Annotation[]) => {
      const { x, y } = canvasToRealCoords(clientX, clientY);
      const clickedAnnotation = checkAnnotationClick(x, y, annotations);

      if (clickedAnnotation) {
        setAnnotationToDelete(clickedAnnotation.id);
        setIsDeleteModalOpen(true);
      }
    },
    [canvasToRealCoords, checkAnnotationClick]
  );

  // 삭제 확인
  const handleDeleteConfirm = useCallback(() => {
    if (annotationToDelete) {
      deleteAnnotation(annotationToDelete);
      setAnnotationToDelete(null);
      setIsDeleteModalOpen(false);
    }
  }, [annotationToDelete, deleteAnnotation]);

  // 삭제 취소
  const handleDeleteCancel = useCallback(() => {
    setAnnotationToDelete(null);
    setIsDeleteModalOpen(false);
  }, []);

  return {
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
    handleAnnotationClickForDelete,
    previewShape,
    isTextModalOpen,
    textModalPosition,
    handleTextSubmit,
    handleTextModalClose,
    isDeleteModalOpen,
    annotationToDelete,
    handleDeleteConfirm,
    handleDeleteCancel,
  };
};
