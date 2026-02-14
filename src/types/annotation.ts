/**
 * 주석/마크업 타입 정의
 */

export type AnnotationType = "text" | "arrow" | "rectangle" | "circle";

export interface Annotation {
  id: string;
  type: AnnotationType;
  // 도면별로 주석을 구분하기 위한 컨텍스트
  drawingId: string;
  discipline: string | null;
  revision: string | null;
  // 위치 정보 (캔버스 좌표계)
  x: number;
  y: number;
  // 타입별 추가 데이터
  data: TextAnnotationData | ArrowAnnotationData | ShapeAnnotationData;
  // 생성/수정 시간
  createdAt: number;
  updatedAt: number;
}

export interface TextAnnotationData {
  text: string;
  fontSize: number; // 12, 14, 16, 18, 20
  color: string; // hex color
  backgroundColor?: string; // 배경색 (선택)
}

export interface ArrowAnnotationData {
  endX: number;
  endY: number;
  color: string;
  lineWidth: number; // 2, 3, 4, 5
  text?: string; // 화살표에 텍스트 추가 가능
}

export interface ShapeAnnotationData {
  width: number;
  height: number;
  color: string;
  lineWidth: number;
  fill?: boolean;
}

export type AnnotationTool = AnnotationType | null;
