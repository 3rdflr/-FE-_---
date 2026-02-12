import { create } from "zustand";
import type {
  Metadata,
  LayerState,
  Drawing,
  Discipline,
  Revision,
  ViewportState,
} from "../types/metadata";

/**
 * DrawingStore 인터페이스
 * - 애플리케이션의 전체 상태와 액션을 정의
 */
interface DrawingStore {
  // ===== 데이터 =====
  metadata: Metadata | null; // 프로젝트 전체 메타데이터 (도면, 공종 등)
  loadedImages: Map<string, HTMLImageElement>; // 로드된 이미지 캐시 (경로: 이미지 객체)

  // ===== 네비게이션 상태 =====
  currentDrawingId: string | null; // 현재 선택된 도면 ID
  currentDiscipline: string | null; // 현재 선택된 공종 (예: "건축", "전기")
  currentRegion: string | null; // 현재 선택된 영역 (예: "A", "B")
  currentRevision: string | null; // 현재 선택된 리비전 (예: "Rev.01")

  // ===== 레이어 상태 =====
  layers: LayerState[]; // 활성화된 레이어 목록 (드래그 가능, 투명도 조절 가능)

  // ===== 뷰포트 상태 =====
  viewport: ViewportState; // 캔버스 확대/축소 및 이동 상태 (초기값: 100%, 중앙)

  // ===== 드래그 & 선택 상태 =====
  draggingLayer: string | null; // 현재 드래그 중인 레이어의 공종명
  selectedLayer: string | null; // 현재 선택된 레이어의 공종명 (편집용)

  // ===== 캔버스 정보 =====
  canvasSize: { width: number; height: number }; // 캔버스 크기 (중앙 계산에 사용)

  // ===== 기본 액션 =====
  setMetadata: (metadata: Metadata) => void; // 메타데이터 설정
  loadImage: (path: string) => Promise<HTMLImageElement>; // 이미지 로드 (캐싱 포함)
  setCanvasSize: (width: number, height: number) => void; // 캔버스 크기 설정

  // ===== 네비게이션 액션 =====
  selectDrawing: (drawingId: string) => void; // 도면 선택
  selectDiscipline: (discipline: string) => void; // 공종 선택
  selectRegion: (region: string | null) => void; // 영역 선택
  selectRevision: (revision: string) => void; // 리비전 선택

  // ===== 레이어 액션 =====
  toggleLayer: (discipline: string) => void; // 레이어 표시/숨김 토글
  setLayerOpacity: (discipline: string, opacity: number) => void; // 레이어 투명도 설정
  setLayerOffset: (
    discipline: string,
    offsetX: number,
    offsetY: number,
  ) => void; // 레이어 위치 이동
  resetLayerOffset: (discipline: string) => void; // 단일 레이어 위치 초기화
  resetAllLayerOffsets: () => void; // 모든 레이어 위치 초기화
  toggleLayerLock: (discipline: string) => void; // 레이어 잠금/해제 토글
  setDraggingLayer: (discipline: string | null) => void; // 드래그 중인 레이어 설정
  setSelectedLayer: (discipline: string | null) => void; // 선택된 레이어 설정
  bringLayerToFront: (discipline: string) => void; // 레이어를 최상위로 이동
  sendLayerToBack: (discipline: string) => void; // 레이어를 최하위로 이동

  // ===== 뷰포트 액션 =====
  setViewport: (viewport: Partial<ViewportState>) => void; // 뷰포트 상태 업데이트
  resetViewport: () => void; // 뷰포트 초기화
  zoomIn: () => void; // 확대
  zoomOut: () => void; // 축소

  // ===== 계산된 값 (Computed Getters) =====
  getCurrentDrawing: () => Drawing | null; // 현재 도면 데이터 가져오기
  getCurrentDisciplineData: () => Discipline | null; // 현재 공종 데이터 가져오기
  getCurrentRevisionData: () => Revision | null; // 현재 리비전 데이터 가져오기
  getAvailableDisciplines: () => string[]; // 현재 도면에서 사용 가능한 공종 목록
  getAvailableRevisions: () => Revision[]; // 현재 공종/영역에서 사용 가능한 리비전 목록
}

/**
 * 초기 뷰포트 상태
 * - 100% 확대, 오프셋 0 (캔버스 중앙에 이미지가 표시됨)
 */
const INITIAL_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

export const useDrawingStore = create<DrawingStore>((set, get) => ({
  // ===== 초기 상태 =====
  metadata: null,
  loadedImages: new Map(),
  currentDrawingId: null,
  currentDiscipline: null,
  currentRegion: null,
  currentRevision: null,
  layers: [],
  viewport: { ...INITIAL_VIEWPORT },
  draggingLayer: null,
  selectedLayer: null,
  canvasSize: { width: 0, height: 0 },

  // ===== 기본 액션 구현 =====

  /**
   * 메타데이터 설정
   * - 프로젝트 데이터를 로드하고 초기 도면("00")을 선택
   * - 뷰포트와 레이어를 초기화
   */
  setMetadata: (metadata) => {
    set({
      metadata,
      currentDrawingId: "00", // 기본 도면 ID
      viewport: { ...INITIAL_VIEWPORT }, // 뷰포트 초기화
      layers: [], // 레이어 초기화
    });
  },

  /**
   * 이미지 로드 (캐싱 포함)
   * - 이미 로드된 이미지는 캐시에서 반환
   * - 새 이미지는 로드 후 캐시에 저장
   */
  loadImage: async (path) => {
    const { loadedImages } = get();

    // 캐시에 이미 있으면 즉시 반환
    if (loadedImages.has(path)) {
      return loadedImages.get(path)!;
    }

    // 새 이미지 로드
    return new Promise((resolve, reject) => {
      const img = new Image();

      // 이미지 로드 성공 시
      img.onload = () => {
        // 캐시에 저장 (불변성을 위해 새 Map 생성)
        set((state) => ({
          loadedImages: new Map(state.loadedImages).set(path, img),
        }));
        resolve(img);
      };

      // 이미지 로드 실패 시
      img.onerror = reject;

      // 이미지 경로 설정 (로드 시작)
      img.src = `/data/drawings/${path}`;
    });
  },

  /**
   * 캔버스 크기 설정
   * - 캔버스 요소의 크기가 변경될 때 호출
   */
  setCanvasSize: (width, height) => {
    set({ canvasSize: { width, height } });
  },

  // ===== 네비게이션 액션 구현 =====

  /**
   * 도면 선택
   * - 새로운 도면으로 전환하고 관련 상태를 초기화
   * - 첫 번째 공종과 리비전을 자동으로 선택
   */
  selectDrawing: (drawingId) => {
    const { metadata } = get();
    if (!metadata) return; // 메타데이터가 없으면 중단

    const drawing = metadata.drawings[drawingId];
    if (!drawing) return; // 해당 도면이 없으면 중단

    // 도면의 공종 목록 가져오기
    const disciplines = Object.keys(drawing.disciplines || {});
    const firstDiscipline = disciplines[0] || null;

    // 도면 전환 시 상태 초기화
    set({
      currentDrawingId: drawingId,
      currentDiscipline: firstDiscipline, // 첫 번째 공종 선택
      currentRegion: null, // 영역 초기화
      currentRevision: null, // 리비전 초기화
      layers: [], // 레이어 초기화
      viewport: { ...INITIAL_VIEWPORT }, // 뷰포트 초기화
      selectedLayer: null, // 선택 초기화
      draggingLayer: null, // 드래그 초기화
    });

    // 첫 번째 공종이 있으면 자동으로 리비전 선택
    if (firstDiscipline) {
      const disciplineData = drawing.disciplines![firstDiscipline];

      // 영역(Region)이 있는 경우
      if (disciplineData.regions) {
        const firstRegion = Object.keys(disciplineData.regions)[0];
        const firstRevision = disciplineData.regions[firstRegion].revisions[0];
        set({
          currentRegion: firstRegion,
          currentRevision: firstRevision.version,
        });
      }
      // 영역 없이 리비전만 있는 경우
      else if (
        disciplineData.revisions &&
        disciplineData.revisions.length > 0
      ) {
        set({ currentRevision: disciplineData.revisions[0].version });
      }
    }
  },

  /**
   * 공종 선택
   * - 현재 도면 내에서 다른 공종으로 전환
   * - 해당 공종의 첫 번째 리비전을 자동으로 선택
   */
  selectDiscipline: (discipline) => {
    const { getCurrentDrawing } = get();
    const drawing = getCurrentDrawing();
    if (!drawing || !drawing.disciplines) return;

    const disciplineData = drawing.disciplines[discipline];
    if (!disciplineData) return; // 해당 공종이 없으면 중단

    // 공종 변경 시 영역과 리비전 초기화
    set({
      currentDiscipline: discipline,
      currentRegion: null,
      currentRevision: null,
    });

    // 영역(Region)이 있는 경우
    if (disciplineData.regions) {
      const firstRegion = Object.keys(disciplineData.regions)[0];
      const firstRevision = disciplineData.regions[firstRegion].revisions[0];
      set({
        currentRegion: firstRegion,
        currentRevision: firstRevision.version,
      });
    }
    // 영역 없이 리비전만 있는 경우
    else if (disciplineData.revisions && disciplineData.revisions.length > 0) {
      set({ currentRevision: disciplineData.revisions[0].version });
    }
  },

  /**
   * 영역 선택
   * - 현재 공종 내에서 특정 영역으로 전환
   * - 해당 영역의 첫 번째 리비전을 자동으로 선택
   */
  selectRegion: (region) => {
    const { getCurrentDisciplineData } = get();
    const disciplineData = getCurrentDisciplineData();
    if (!disciplineData?.regions || !region) return;

    const regionData = disciplineData.regions[region];
    if (!regionData) return; // 해당 영역이 없으면 중단

    // 영역 변경 시 첫 번째 리비전 선택
    set({
      currentRegion: region,
      currentRevision: regionData.revisions[0]?.version || null,
    });
  },

  /**
   * 리비전 선택
   * - 현재 공종/영역 내에서 특정 리비전으로 전환
   */
  selectRevision: (revision) => {
    set({ currentRevision: revision });
  },

  // ===== 레이어 액션 구현 =====

  /**
   * 레이어 토글 (표시/숨김)
   * - 레이어가 이미 있으면 visible 상태를 반전
   * - 레이어가 없으면 새로 생성 (기본값: 투명도 70%, 오프셋 0,0)
   */
  toggleLayer: (discipline) => {
    set((state) => {
      const layers = [...state.layers]; // 불변성을 위한 배열 복사
      const index = layers.findIndex((l) => l.discipline === discipline);

      if (index >= 0) {
        // 레이어가 이미 있으면 표시/숨김 토글
        layers[index].visible = !layers[index].visible;
      } else {
        // 레이어가 없으면 새로 생성
        const maxZIndex = Math.max(0, ...layers.map((l) => l.zIndex));
        layers.push({
          discipline,
          visible: true, // 기본값: 표시
          opacity: 70, // 기본값: 70% 불투명도
          offsetX: 0, // 기본값: 오프셋 없음 (정렬됨)
          offsetY: 0,
          locked: false, // 기본값: 잠금 해제
          zIndex: maxZIndex + 1, // 가장 위에 배치
        });
      }

      return { layers };
    });
  },

  /**
   * 레이어 투명도 설정
   * - 0 (완전 투명) ~ 100 (완전 불투명)
   */
  setLayerOpacity: (discipline, opacity) => {
    set((state) => {
      const layers = [...state.layers];
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer) {
        layer.opacity = opacity;
      }
      return { layers };
    });
  },

  /**
   * 레이어 위치 설정 (드래그 앤 드롭)
   * - 레이어가 잠금 상태가 아닐 때만 이동 가능
   */
  setLayerOffset: (discipline, offsetX, offsetY) => {
    set((state) => {
      const layers = [...state.layers];
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer && !layer.locked) {
        // 잠금되지 않은 경우에만 이동
        layer.offsetX = offsetX;
        layer.offsetY = offsetY;
      }
      return { layers };
    });
  },

  /**
   * 단일 레이어 위치 초기화
   * - 특정 레이어를 원래 위치(0, 0)로 되돌림
   */
  resetLayerOffset: (discipline) => {
    set((state) => {
      const layers = [...state.layers];
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer) {
        layer.offsetX = 0;
        layer.offsetY = 0;
      }
      return { layers };
    });
  },

  /**
   * 모든 레이어 위치 초기화
   * - 모든 레이어를 원래 위치로 되돌림
   */
  resetAllLayerOffsets: () => {
    set((state) => {
      const layers = state.layers.map((l) => ({
        ...l,
        offsetX: 0,
        offsetY: 0,
      }));
      return { layers };
    });
  },

  /**
   * 레이어 잠금/해제 토글
   * - 잠긴 레이어는 드래그할 수 없음
   */
  toggleLayerLock: (discipline) => {
    set((state) => {
      const layers = [...state.layers];
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer) {
        layer.locked = !layer.locked;
      }
      return { layers };
    });
  },

  /**
   * 드래그 중인 레이어 설정
   * - 드래그 시작/종료 시 호출
   */
  setDraggingLayer: (discipline) => {
    set({ draggingLayer: discipline });
  },

  /**
   * 선택된 레이어 설정
   * - 편집이나 조작할 레이어 선택
   */
  setSelectedLayer: (discipline) => {
    set({ selectedLayer: discipline });
  },

  /**
   * 레이어를 최상위로 이동
   * - 다른 모든 레이어 위에 표시
   */
  bringLayerToFront: (discipline) => {
    set((state) => {
      const layers = [...state.layers];
      const maxZIndex = Math.max(...layers.map((l) => l.zIndex));
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer) {
        layer.zIndex = maxZIndex + 1; // 현재 최대값보다 1 큰 값
      }
      return { layers };
    });
  },

  /**
   * 레이어를 최하위로 이동
   * - 다른 모든 레이어 아래에 표시
   */
  sendLayerToBack: (discipline) => {
    set((state) => {
      const layers = [...state.layers];
      const minZIndex = Math.min(...layers.map((l) => l.zIndex));
      const layer = layers.find((l) => l.discipline === discipline);
      if (layer) {
        layer.zIndex = minZIndex - 1; // 현재 최소값보다 1 작은 값
      }
      return { layers };
    });
  },

  // ===== 뷰포트 액션 구현 =====

  /**
   * 뷰포트 상태 업데이트
   * - 부분 업데이트 가능 (offsetX, offsetY, zoom 중 일부만 변경)
   */
  setViewport: (viewportUpdate) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewportUpdate },
    }));
  },

  /**
   * 뷰포트 초기화
   * - 확대/축소 및 이동을 기본 상태로 되돌림
   */
  resetViewport: () => {
    set({ viewport: { ...INITIAL_VIEWPORT } });
  },

  /**
   * 확대 (Zoom In)
   * - 현재 배율의 1.2배로 확대 (최대 10배)
   */
  zoomIn: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.min(10, state.viewport.zoom * 1.2), // 최대 10배까지
      },
    }));
  },

  /**
   * 축소 (Zoom Out)
   * - 현재 배율을 1.2로 나누어 축소 (최소 0.1배)
   */
  zoomOut: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        zoom: Math.max(0.1, state.viewport.zoom / 1.2), // 최소 0.1배까지
      },
    }));
  },

  // ===== 계산된 값 (Computed Getters) =====

  /**
   * 현재 선택된 도면 데이터 가져오기
   * - metadata와 currentDrawingId를 사용하여 도면 객체 반환
   */
  getCurrentDrawing: () => {
    const { metadata, currentDrawingId } = get();
    if (!metadata || !currentDrawingId) return null;
    return metadata.drawings[currentDrawingId] || null;
  },

  /**
   * 현재 선택된 공종 데이터 가져오기
   * - 현재 도면 내에서 선택된 공종의 상세 정보 반환
   */
  getCurrentDisciplineData: () => {
    const { getCurrentDrawing, currentDiscipline } = get();
    const drawing = getCurrentDrawing();
    if (!drawing || !currentDiscipline || !drawing.disciplines) return null;
    return drawing.disciplines[currentDiscipline] || null;
  },

  /**
   * 현재 선택된 리비전 데이터 가져오기
   * - 영역이 있으면 해당 영역의 리비전, 없으면 공종의 리비전 반환
   */
  getCurrentRevisionData: () => {
    const { getCurrentDisciplineData, currentRegion, currentRevision } = get();
    const disciplineData = getCurrentDisciplineData();
    if (!disciplineData || !currentRevision) return null;

    // 영역이 선택된 경우
    if (currentRegion && disciplineData.regions) {
      const regionData = disciplineData.regions[currentRegion];
      return (
        regionData.revisions.find((r) => r.version === currentRevision) || null
      );
    }

    // 영역이 없는 경우 (공종의 리비전 사용)
    return (
      disciplineData.revisions?.find((r) => r.version === currentRevision) ||
      null
    );
  },

  /**
   * 사용 가능한 공종 목록 가져오기
   * - 현재 도면에서 선택 가능한 공종들의 이름 배열
   */
  getAvailableDisciplines: () => {
    const { getCurrentDrawing } = get();
    const drawing = getCurrentDrawing();
    if (!drawing || !drawing.disciplines) return [];
    return Object.keys(drawing.disciplines);
  },

  /**
   * 사용 가능한 리비전 목록 가져오기
   * - 현재 공종/영역에서 선택 가능한 리비전 배열
   */
  getAvailableRevisions: () => {
    const { getCurrentDisciplineData, currentRegion } = get();
    const disciplineData = getCurrentDisciplineData();
    if (!disciplineData) return [];

    // 영역이 선택된 경우
    if (currentRegion && disciplineData.regions) {
      const regionData = disciplineData.regions[currentRegion];
      return regionData.revisions || [];
    }

    // 영역이 없는 경우
    return disciplineData.revisions || [];
  },
}));
