import { useCallback, useRef, useState, useEffect } from "react";
import { useAnnotationStore } from "../store/useAnnotationStore";
import type { TextAnnotationData, ArrowAnnotationData, ShapeAnnotationData } from "../types/annotation";

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
    previewShape,
    isTextModalOpen,
    textModalPosition,
    handleTextSubmit,
    handleTextModalClose,
  };
};
