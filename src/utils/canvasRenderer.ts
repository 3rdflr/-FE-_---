/**
 * canvasRenderer.ts
 * - Canvas 2D 렌더링을 담당하는 유틸리티 클래스
 * - 이미지 그리기, 폴리곤(핫스팟) 그리기, 뷰포트 관리 등을 제공
 */

import type { ImageTransform, Polygon } from "../types/metadata";

/**
 * CanvasRenderer 클래스
 * - Canvas에 이미지와 도형을 그리는 렌더링 엔진
 * - 뷰포트 변환(확대/축소, 이동)을 관리
 */
export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D; // Canvas 2D 컨텍스트
  private viewportZoom: number = 1; // 뷰포트 확대/축소 비율
  private viewportOffsetX: number = 0; // 뷰포트 X축 오프셋
  private viewportOffsetY: number = 0; // 뷰포트 Y축 오프셋

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 캔버스 전체 지우기
   * - DPR(Device Pixel Ratio)을 고려하여 실제 크기로 지움
   */
  clear() {
    const canvas = this.ctx.canvas;
    // 변환 상태를 저장하고 초기화
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 단위 행렬로 초기화
    this.ctx.clearRect(0, 0, canvas.width, canvas.height); // 전체 영역 지우기
    this.ctx.restore(); // 변환 상태 복원
  }

  /**
   * 이미지를 화면 중앙에 그리기
   * - 이미지의 중심을 기준점으로 배치
   * - 레이어 오프셋과 투명도 적용 가능
   *
   * @param img - 그릴 이미지 객체
   * @param centerX - 캔버스 중앙 X 좌표
   * @param centerY - 캔버스 중앙 Y 좌표
   * @param scale - 이미지 확대/축소 비율
   * @param offsetX - 추가 X 오프셋 (레이어 드래그용)
   * @param offsetY - 추가 Y 오프셋 (레이어 드래그용)
   * @param opacity - 투명도 (0~1, 기본값 1)
   */
  drawImageCentered(
    img: HTMLImageElement,
    centerX: number,
    centerY: number,
    scale: number,
    offsetX: number = 0,
    offsetY: number = 0,
    opacity: number = 1,
  ) {
    this.ctx.save(); // 현재 상태 저장
    this.ctx.globalAlpha = opacity; // 투명도 설정

    // 이미지 중앙을 기준으로 그릴 위치 계산
    // centerX, centerY는 이미지 중심이 위치할 지점
    const drawX = centerX + offsetX - (img.width * scale) / 2;
    const drawY = centerY + offsetY - (img.height * scale) / 2;

    // 이미지 그리기
    this.ctx.drawImage(
      img,
      drawX, // 그릴 X 위치
      drawY, // 그릴 Y 위치
      img.width * scale, // 그릴 너비
      img.height * scale, // 그릴 높이
    );

    this.ctx.restore(); // 상태 복원
  }

  /**
   * Hotspot 폴리곤을 배치도 이미지 위에 정확히 그리기
   * - 클릭 가능한 영역을 시각적으로 표시
   * - 호버 시 하이라이트 효과 적용
   *
   * @param vertices - 폴리곤의 꼭짓점 좌표 배열 (원본 이미지 픽셀 좌표)
   * @param imageX - 이미지 좌상단 X 좌표 (캔버스 좌표)
   * @param imageY - 이미지 좌상단 Y 좌표 (캔버스 좌표)
   * @param imageScale - 이미지 확대/축소 비율
   * @param isHovered - 마우스 호버 여부
   * @param label - 폴리곤에 표시할 라벨 텍스트 (선택사항)
   */
  drawHotspotOnImage(
    vertices: [number, number][],
    imageX: number,
    imageY: number,
    imageScale: number,
    isHovered: boolean = false,
    label?: string,
  ) {
    // 폴리곤은 최소 3개의 점이 필요
    if (vertices.length < 3) return;

    this.ctx.save(); // 현재 상태 저장

    // viewport transform을 무시하고 절대 좌표로 그리기 위해 transform 초기화
    // DPR은 유지해야 함
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    // viewport offset과 zoom을 수동으로 적용하여 올바른 위치 계산
    const viewportX = this.viewportOffsetX;
    const viewportY = this.viewportOffsetY;
    const zoom = this.viewportZoom;

    // === 폴리곤 경로 생성 ===
    // 이미지 좌표계를 캔버스 좌표계로 변환 (viewport 적용)
    this.ctx.beginPath();
    const firstVertex = vertices[0];
    // 첫 번째 점으로 이동
    this.ctx.moveTo(
      viewportX + (imageX + firstVertex[0] * imageScale) * zoom,
      viewportY + (imageY + firstVertex[1] * imageScale) * zoom,
    );

    // 나머지 점들을 연결
    for (let i = 1; i < vertices.length; i++) {
      const vertex = vertices[i];
      this.ctx.lineTo(
        viewportX + (imageX + vertex[0] * imageScale) * zoom,
        viewportY + (imageY + vertex[1] * imageScale) * zoom,
      );
    }
    this.ctx.closePath(); // 경로를 닫아 폴리곤 완성

    // === 폴리곤 채우기 ===
    // 호버 시 노란색, 평상시 파란색
    this.ctx.fillStyle = isHovered
      ? "rgba(255, 193, 7, 0.35)" // 노란색 (호버)
      : "rgba(59, 130, 246, 0.2)"; // 파란색 (평상시)
    this.ctx.fill();

    // === 폴리곤 테두리 ===
    this.ctx.strokeStyle = isHovered
      ? "rgba(255, 193, 7, 1)" // 진한 노란색 (호버)
      : "rgba(59, 130, 246, 0.7)"; // 파란색 (평상시)
    this.ctx.lineWidth = isHovered ? 3 : 2; // 호버 시 더 두껍게
    this.ctx.stroke();

    // === 라벨 그리기 (옵션) ===
    if (label) {
      // 폴리곤 중심점 계산 (모든 꼭짓점의 평균, viewport 적용)
      let cx = 0,
        cy = 0;
      for (const v of vertices) {
        cx += viewportX + (imageX + v[0] * imageScale) * zoom;
        cy += viewportY + (imageY + v[1] * imageScale) * zoom;
      }
      cx /= vertices.length;
      cy /= vertices.length;

      // 라벨 배경 그리기
      this.ctx.font = "bold 12px sans-serif";
      const textMetrics = this.ctx.measureText(label);
      const padding = 6;
      const bgWidth = textMetrics.width + padding * 2;
      const bgHeight = 20;

      // 배경색 (호버 시 노란색, 평상시 파란색)
      this.ctx.fillStyle = isHovered
        ? "rgba(255, 193, 7, 0.9)"
        : "rgba(59, 130, 246, 0.85)";

      // 둥근 사각형 배경
      this.ctx.beginPath();
      this.ctx.roundRect(
        cx - bgWidth / 2,
        cy - bgHeight / 2,
        bgWidth,
        bgHeight,
        4, // 모서리 반경
      );
      this.ctx.fill();

      // 라벨 텍스트 (흰색)
      this.ctx.fillStyle = "white";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText(label, cx, cy);
    }

    this.ctx.restore(); // 상태 복원
  }

  /**
   * 포인트가 폴리곤 내부에 있는지 확인
   * - Ray Casting Algorithm 사용
   * - 캔버스 좌표를 이미지 좌표로 변환하여 체크
   *
   * @param canvasX - 캔버스 X 좌표
   * @param canvasY - 캔버스 Y 좌표
   * @param vertices - 폴리곤의 꼭짓점 배열
   * @param imageX - 이미지 좌상단 X 좌표
   * @param imageY - 이미지 좌상단 Y 좌표
   * @param imageScale - 이미지 확대/축소 비율
   * @param viewportOffsetX - 뷰포트 X 오프셋
   * @param viewportOffsetY - 뷰포트 Y 오프셋
   * @param viewportZoom - 뷰포트 확대/축소 비율
   * @returns 포인트가 폴리곤 내부에 있으면 true
   */
  isPointInHotspot(
    canvasX: number,
    canvasY: number,
    vertices: [number, number][],
    imageX: number,
    imageY: number,
    imageScale: number,
    viewportOffsetX: number = 0,
    viewportOffsetY: number = 0,
    viewportZoom: number = 1,
  ): boolean {
    // 뷰포트 변환 역적용하여 실제 캔버스 좌표 얻기
    const realX = (canvasX - viewportOffsetX) / viewportZoom;
    const realY = (canvasY - viewportOffsetY) / viewportZoom;

    // 이미지 좌표계로 변환
    const imgX = (realX - imageX) / imageScale;
    const imgY = (realY - imageY) / imageScale;

    // === Ray Casting Algorithm ===
    // 점에서 수평선을 그었을 때 폴리곤 경계와 교차하는 횟수로 판별
    // 홀수번 교차하면 내부, 짝수번 교차하면 외부
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][0],
        yi = vertices[i][1];
      const xj = vertices[j][0],
        yj = vertices[j][1];

      // 현재 꼭짓점 쌍이 수평선과 교차하는지 확인
      if (
        yi > imgY !== yj > imgY && // y 범위 체크
        imgX < ((xj - xi) * (imgY - yi)) / (yj - yi) + xi // 교차점 x 좌표 계산
      ) {
        inside = !inside; // 교차할 때마다 토글
      }
    }

    return inside;
  }

  /**
   * 뷰포트 설정
   * - 확대/축소 및 이동을 Canvas 변환 행렬에 적용
   * - DPR(Device Pixel Ratio)을 유지하면서 viewport 적용
   */
  setViewport(offsetX: number, offsetY: number, zoom: number) {
    this.viewportOffsetX = offsetX;
    this.viewportOffsetY = offsetY;
    this.viewportZoom = zoom;

    // DPR 가져오기
    const dpr = window.devicePixelRatio || 1;

    // Canvas 변환 행렬 설정
    // 1. 초기화
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    // 2. DPR 적용 (고해상도 디스플레이 대응)
    this.ctx.scale(dpr, dpr);
    // 3. 뷰포트 이동 적용
    this.ctx.translate(offsetX, offsetY);
    // 4. 뷰포트 확대/축소 적용
    this.ctx.scale(zoom, zoom);
  }

  /**
   * 뷰포트 초기화
   * - 확대/축소 및 이동을 기본 상태로 되돌림
   * - DPR은 유지
   */
  resetViewport() {
    this.viewportOffsetX = 0;
    this.viewportOffsetY = 0;
    this.viewportZoom = 1;

    // DPR 가져오기
    const dpr = window.devicePixelRatio || 1;

    // DPR만 적용된 상태로 초기화
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Canvas 컨텍스트 가져오기
   * - 직접 컨텍스트 조작이 필요한 경우 사용
   */
  getContext() {
    return this.ctx;
  }
}

/**
 * Canvas 크기 조정 (Device Pixel Ratio 고려)
 * - 고해상도 디스플레이(Retina 등)에서 선명한 렌더링을 위해 DPR 적용
 *
 * @param canvas - 크기를 조정할 Canvas 요소
 * @returns 조정된 캔버스의 논리적 크기 {width, height}
 */
export function resizeCanvas(canvas: HTMLCanvasElement): {
  width: number;
  height: number;
} {
  // Device Pixel Ratio 가져오기 (고해상도 화면 대응)
  const dpr = window.devicePixelRatio || 1;
  // Canvas의 CSS 크기 가져오기
  const rect = canvas.getBoundingClientRect();

  // 실제 픽셀 크기 설정 (DPR 적용)
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 컨텍스트 스케일 조정 (DPR만큼 확대하여 선명하게)
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
  }

  // 논리적 크기 반환 (CSS 크기)
  return { width: rect.width, height: rect.height };
}
