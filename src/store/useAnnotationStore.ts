import { create } from "zustand";
import type {
  Annotation,
  AnnotationType,
  AnnotationTool,
  TextAnnotationData,
  ArrowAnnotationData,
  ShapeAnnotationData,
} from "../types/annotation";

/**
 * 주석/마크업 스토어
 */
interface AnnotationStore {
  // ===== 상태 =====
  annotations: Annotation[]; // 모든 주석 목록
  currentTool: AnnotationTool; // 현재 선택된 도구
  selectedAnnotationId: string | null; // 현재 선택된 주석 ID
  isAnnotationMode: boolean; // 주석 모드 활성화 여부

  // 도구 설정
  textSettings: {
    fontSize: number;
    color: string;
    backgroundColor?: string;
  };
  arrowSettings: {
    color: string;
    lineWidth: number;
  };
  shapeSettings: {
    color: string;
    lineWidth: number;
    fill: boolean;
  };

  // ===== 액션 =====
  setAnnotationMode: (enabled: boolean) => void;
  setCurrentTool: (tool: AnnotationTool) => void;
  setSelectedAnnotation: (id: string | null) => void;

  // 주석 CRUD
  addAnnotation: (annotation: Omit<Annotation, "id" | "createdAt" | "updatedAt">) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearAnnotations: () => void;

  // 현재 도면의 주석만 가져오기
  getAnnotationsForCurrentDrawing: (
    drawingId: string,
    discipline: string | null,
    revision: string | null,
  ) => Annotation[];

  // 설정 업데이트
  updateTextSettings: (settings: Partial<AnnotationStore["textSettings"]>) => void;
  updateArrowSettings: (settings: Partial<AnnotationStore["arrowSettings"]>) => void;
  updateShapeSettings: (settings: Partial<AnnotationStore["shapeSettings"]>) => void;

  // 내보내기/가져오기
  exportAnnotations: () => string; // JSON 문자열로 내보내기
  importAnnotations: (json: string) => void; // JSON에서 가져오기
}

const generateId = () => `annotation_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  // ===== 초기 상태 =====
  annotations: [],
  currentTool: null,
  selectedAnnotationId: null,
  isAnnotationMode: false,

  textSettings: {
    fontSize: 16,
    color: "#ef4444", // red-500
    backgroundColor: "#ffffff",
  },
  arrowSettings: {
    color: "#ef4444", // red-500
    lineWidth: 3,
  },
  shapeSettings: {
    color: "#ef4444", // red-500
    lineWidth: 3,
    fill: false,
  },

  // ===== 액션 구현 =====
  setAnnotationMode: (enabled) => set({ isAnnotationMode: enabled }),

  setCurrentTool: (tool) => set({ currentTool: tool }),

  setSelectedAnnotation: (id) => set({ selectedAnnotationId: id }),

  addAnnotation: (annotationData) => {
    const annotation: Annotation = {
      ...annotationData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      annotations: [...state.annotations, annotation],
    }));
  },

  updateAnnotation: (id, updates) => {
    set((state) => ({
      annotations: state.annotations.map((ann) =>
        ann.id === id ? { ...ann, ...updates, updatedAt: Date.now() } : ann
      ),
    }));
  },

  deleteAnnotation: (id) => {
    set((state) => ({
      annotations: state.annotations.filter((ann) => ann.id !== id),
      selectedAnnotationId:
        state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    }));
  },

  clearAnnotations: () => set({ annotations: [], selectedAnnotationId: null }),

  getAnnotationsForCurrentDrawing: (drawingId, discipline, revision) => {
    const { annotations } = get();
    return annotations.filter(
      (ann) =>
        ann.drawingId === drawingId &&
        ann.discipline === discipline &&
        ann.revision === revision
    );
  },

  updateTextSettings: (settings) => {
    set((state) => ({
      textSettings: { ...state.textSettings, ...settings },
    }));
  },

  updateArrowSettings: (settings) => {
    set((state) => ({
      arrowSettings: { ...state.arrowSettings, ...settings },
    }));
  },

  updateShapeSettings: (settings) => {
    set((state) => ({
      shapeSettings: { ...state.shapeSettings, ...settings },
    }));
  },

  exportAnnotations: () => {
    const { annotations } = get();
    return JSON.stringify(annotations, null, 2);
  },

  importAnnotations: (json) => {
    try {
      const annotations = JSON.parse(json) as Annotation[];
      set({ annotations });
    } catch (error) {
      console.error("Failed to import annotations:", error);
    }
  },
}));
