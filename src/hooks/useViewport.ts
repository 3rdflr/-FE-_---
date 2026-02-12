/**
 * useViewport 훅
 * - 캔버스의 확대/축소, 드래그 패닝(이동) 기능을 제공하는 커스텀 훅
 * - 마우스 휠로 확대/축소, 드래그로 이동 가능
 */

import { useState, useCallback, useRef } from "react";

/**
 * 뷰포트 상태 인터페이스
 */
interface Viewport {
  offsetX: number;  // X축 이동 오프셋
  offsetY: number;  // Y축 이동 오프셋
  zoom: number;     // 확대/축소 비율
}

/**
 * useViewport 훅의 반환 타입
 */
interface UseViewportReturn {
  viewport: Viewport;                       // 현재 뷰포트 상태
  handleWheel: (e: WheelEvent) => void;     // 마우스 휠 이벤트 핸들러 (확대/축소)
  handleMouseDown: (e: MouseEvent) => void; // 마우스 다운 이벤트 핸들러 (드래그 시작)
  handleMouseMove: (e: MouseEvent) => void; // 마우스 이동 이벤트 핸들러 (드래그 중)
  handleMouseUp: () => void;                // 마우스 업 이벤트 핸들러 (드래그 종료)
  resetViewport: () => void;                // 뷰포트 초기화
  zoomIn: () => void;                       // 프로그래밍 방식 확대
  zoomOut: () => void;                      // 프로그래밍 방식 축소
}

/**
 * useViewport 훅 함수
 * @param canvasRef - 캔버스 요소의 ref
 * @returns 뷰포트 상태와 조작 함수들
 */
export function useViewport(
  canvasRef: React.RefObject<HTMLCanvasElement>,
): UseViewportReturn {
  // 뷰포트 상태 (확대/축소 및 이동)
  const [viewport, setViewport] = useState<Viewport>({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  });

  // 드래그 상태 추적 (ref 사용으로 리렌더링 방지)
  const isDragging = useRef(false);
  // 마지막 마우스 위치 저장
  const lastPos = useRef({ x: 0, y: 0 });

  /**
   * 마우스 휠 이벤트 핸들러 (확대/축소)
   * - 휠을 위로 굴리면 확대, 아래로 굴리면 축소
   * - 마우스 커서 위치를 중심으로 확대/축소
   */
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();  // 페이지 스크롤 방지

      const canvas = canvasRef.current;
      if (!canvas) return;

      // 캔버스 기준 마우스 좌표 계산
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewport((prev) => {
        // 휠 방향에 따라 확대/축소 비율 결정
        const delta = e.deltaY > 0 ? 0.9 : 1.1;  // 아래로 휠: 축소, 위로 휠: 확대
        // 새로운 줌 레벨 계산 (최소 0.1배, 최대 10배)
        const newZoom = Math.max(0.1, Math.min(10, prev.zoom * delta));

        // 마우스 위치를 중심으로 줌 (줌 후에도 마우스 커서 아래의 내용이 같은 위치에 있도록)
        const zoomChange = newZoom / prev.zoom;
        const newOffsetX = mouseX - (mouseX - prev.offsetX) * zoomChange;
        const newOffsetY = mouseY - (mouseY - prev.offsetY) * zoomChange;

        return {
          zoom: newZoom,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        };
      });
    },
    [canvasRef],
  );

  /**
   * 마우스 다운 이벤트 핸들러 (드래그 시작)
   * - 왼쪽 버튼만 처리
   */
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;  // 왼쪽 버튼(0)만 처리

    isDragging.current = true;  // 드래그 시작
    lastPos.current = { x: e.clientX, y: e.clientY };  // 시작 위치 저장
  }, []);

  /**
   * 마우스 이동 이벤트 핸들러 (드래그 중)
   * - 드래그 중일 때만 뷰포트 이동
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;  // 드래그 중이 아니면 무시

    // 이전 위치와의 차이 계산
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;

    // 뷰포트 오프셋 업데이트
    setViewport((prev) => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }));

    // 현재 위치를 다음 이동의 기준점으로 저장
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  /**
   * 마우스 업 이벤트 핸들러 (드래그 종료)
   */
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;  // 드래그 종료
  }, []);

  /**
   * 뷰포트 초기화
   * - 확대/축소 및 이동을 기본 상태로 되돌림
   */
  const resetViewport = useCallback(() => {
    setViewport({ offsetX: 0, offsetY: 0, zoom: 1 });
  }, []);

  /**
   * 프로그래밍 방식 확대
   * - 버튼 클릭 등으로 확대할 때 사용
   */
  const zoomIn = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.min(10, prev.zoom * 1.2),  // 최대 10배까지
    }));
  }, []);

  /**
   * 프로그래밍 방식 축소
   * - 버튼 클릭 등으로 축소할 때 사용
   */
  const zoomOut = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2),  // 최소 0.1배까지
    }));
  }, []);

  // 뷰포트 상태와 모든 조작 함수 반환
  return {
    viewport,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetViewport,
    zoomIn,
    zoomOut,
  };
}
