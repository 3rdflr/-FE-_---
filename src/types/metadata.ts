/**
 * 이미지 변환 정보
 * - 이미지를 화면에 표시할 때 필요한 위치, 크기, 회전 정보
 */
export interface ImageTransform {
  relativeTo?: string;  // 기준이 되는 이미지 파일명 (상대 좌표계를 사용할 때)
  x: number;            // X축 위치 (픽셀)
  y: number;            // Y축 위치 (픽셀)
  scale: number;        // 확대/축소 비율 (1.0 = 100%)
  rotation: number;     // 회전 각도 (라디안)
}

/**
 * 다각형(영역) 정보
 * - 특정 영역을 정의하는 다각형 좌표와 변환 정보
 */
export interface Polygon {
  vertices: [number, number][];  // 다각형의 꼭짓점 좌표들 [x, y] 배열
  polygonTransform: ImageTransform;  // 다각형의 변환 정보
}

/**
 * 리비전(수정본) 정보
 * - 도면의 특정 버전에 대한 정보
 */
export interface Revision {
  version: string;        // 리비전 버전 (예: "Rev.01", "Rev.02")
  image: string;          // 이미지 파일 경로
  date: string;           // 수정 날짜
  description: string;    // 수정 내용 설명
  changes: string[];      // 변경 사항 목록
  imageTransform?: ImageTransform;  // 이미지 변환 정보 (선택사항)
  polygon?: Polygon;      // 영역 다각형 (선택사항)
}

/**
 * 영역(Region) 정보
 * - 도면 내의 특정 구역 정보 (예: A구역, B구역)
 */
export interface Region {
  polygon: Polygon;       // 영역을 나타내는 다각형
  revisions: Revision[];  // 해당 영역의 리비전 목록
}

/**
 * 공종(Discipline) 정보
 * - 건축, 전기, 기계 등 작업 분야별 정보
 */
export interface Discipline {
  imageTransform?: ImageTransform;  // 이미지 변환 정보 (선택사항)
  image?: string;                   // 공종 이미지 파일 경로 (선택사항)
  polygon?: Polygon;                // 영역 다각형 (선택사항)
  regions?: Record<string, Region>; // 영역별 정보 (영역명: Region 객체)
  revisions?: Revision[];           // 리비전 목록 (영역이 없는 경우)
}

/**
 * 위치(Position) 정보
 * - 전체 배치도 내에서의 하위 도면 위치
 */
export interface Position {
  vertices: [number, number][];  // 위치를 나타내는 다각형 좌표
  imageTransform: ImageTransform;  // 위치 변환 정보
}

/**
 * 도면(Drawing) 정보
 * - 하나의 도면(평면도, 배치도 등)에 대한 전체 정보
 */
export interface Drawing {
  id: string;           // 도면 고유 ID
  name: string;         // 도면 이름 (예: "1층 평면도")
  image: string;        // 도면 이미지 파일 경로
  parent: string | null;  // 상위 도면 ID (전체 배치도의 경우 null)
  position: Position | null;  // 전체 배치도 내에서의 위치 (최상위 도면은 null)
  disciplines?: Record<string, Discipline>;  // 공종별 정보 (공종명: Discipline 객체)
}

/**
 * 공종 정보 (프로젝트 전체)
 * - 프로젝트에서 사용하는 공종 목록
 */
export interface DisciplineInfo {
  name: string;  // 공종 이름 (예: "건축", "전기", "기계")
}

/**
 * 메타데이터 (전체 프로젝트 정보)
 * - 프로젝트의 모든 도면과 설정 정보
 */
export interface Metadata {
  project: {
    name: string;  // 프로젝트 이름
    unit: string;  // 사용 단위 (예: "mm", "m")
  };
  disciplines: DisciplineInfo[];  // 프로젝트의 공종 목록
  drawings: Record<string, Drawing>;  // 모든 도면 정보 (도면 ID: Drawing 객체)
}

/**
 * UI 상태 타입 - 드래그 가능한 레이어 상태
 * - 화면에 표시되는 각 공종 레이어의 표시 상태
 */
export interface LayerState {
  discipline: string;  // 공종명
  visible: boolean;    // 표시/숨김 여부
  opacity: number;     // 투명도 (0-100)
  offsetX: number;     // 드래그로 이동한 X축 오프셋 (캔버스 픽셀 단위)
  offsetY: number;     // 드래그로 이동한 Y축 오프셋 (캔버스 픽셀 단위)
  locked: boolean;     // 레이어 잠금 여부 (잠금 시 드래그 불가)
  zIndex: number;      // 레이어 표시 순서 (높을수록 위에 표시)
}

/**
 * 뷰포트 상태
 * - 캔버스의 확대/축소 및 이동 상태
 */
export interface ViewportState {
  offsetX: number;  // 뷰포트 X축 이동 오프셋 (픽셀)
  offsetY: number;  // 뷰포트 Y축 이동 오프셋 (픽셀)
  zoom: number;     // 확대/축소 비율 (1.0 = 100%)
}
