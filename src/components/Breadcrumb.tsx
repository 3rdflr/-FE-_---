import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

/**
 * Breadcrumb (브레드크럼) 컴포넌트
 * - 사용자가 현재 어떤 위치에 있는지 보여주는 네비게이션 UI
 * - 예: 전체 배치도 › 1층 평면도 › 건축 › Region A › Rev.01
 */
export const Breadcrumb: React.FC = () => {
  // Drawing Store에서 필요한 상태값과 함수를 가져옴
  const {
    metadata,           // 전체 도면 정보가 담긴 메타데이터
    currentDrawingId,   // 현재 선택된 도면의 ID
    currentDiscipline,  // 현재 선택된 공종 (예: 건축, 전기, 기계 등)
    currentRegion,      // 현재 선택된 영역 (예: A, B, C 구역)
    currentRevision,    // 현재 선택된 리비전 (예: Rev.01, Rev.02)
    selectDrawing,      // 도면을 선택하는 함수
  } = useDrawingStore();

  // 메타데이터나 현재 도면 ID가 없으면 아무것도 표시하지 않음
  if (!metadata || !currentDrawingId) return null;

  // 현재 도면 ID로 메타데이터에서 도면 정보를 찾음
  const drawing = metadata.drawings[currentDrawingId];
  // 도면 정보가 없으면 아무것도 표시하지 않음
  if (!drawing) return null;

  // Breadcrumb에 표시할 항목들을 담을 배열
  const parts: { label: string; onClick?: () => void }[] = [];

  if (drawing.parent) {
    parts.push({
      label: "전체 배치도",
      onClick: () => selectDrawing("00"),
    });
  }

  parts.push({ label: drawing.name });

  if (currentDiscipline) {
    parts.push({ label: currentDiscipline });
  }

  if (currentRegion) {
    parts.push({ label: `Region ${currentRegion}` });
  }

  if (currentRevision) {
    parts.push({ label: currentRevision });
  }

  return (
    <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm overflow-x-auto">
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="mx-2 text-gray-300 dark:text-gray-600 flex-shrink-0">›</span>}

          {part.onClick ? (
            <button
              onClick={part.onClick}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline flex-shrink-0"
            >
              {part.label}
            </button>
          ) : (
            <span
              className={`flex-shrink-0 ${
                index === parts.length - 1
                  ? "text-gray-900 dark:text-gray-100 font-medium"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {part.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
