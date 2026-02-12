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
  // 각 항목은 label(표시할 텍스트)과 onClick(클릭 이벤트, 선택사항)을 가짐
  const parts: { label: string; onClick?: () => void }[] = [];

  // 1. 전체 배치도 링크 추가
  // - 현재 도면이 하위 도면(parent가 있는 경우)일 때만 추가
  // - 클릭하면 "00" ID를 가진 전체 배치도로 이동
  if (drawing.parent) {
    parts.push({
      label: "전체 배치도",
      onClick: () => selectDrawing("00"),
    });
  }

  // 2. 현재 도면 이름 추가
  // - onClick이 없으므로 클릭 불가능한 텍스트로 표시됨
  parts.push({ label: drawing.name });

  // 3. 공종 정보 추가 (있는 경우에만)
  // - 예: 건축, 전기, 기계, 토목 등
  if (currentDiscipline) {
    parts.push({ label: currentDiscipline });
  }

  // 4. 영역 정보 추가 (있는 경우에만)
  // - 예: Region A, Region B 등
  if (currentRegion) {
    parts.push({ label: `Region ${currentRegion}` });
  }

  // 5. 리비전 정보 추가 (있는 경우에만)
  // - 예: Rev.01, Rev.02 등 도면의 수정 버전
  if (currentRevision) {
    parts.push({ label: currentRevision });
  }

  // Breadcrumb UI 렌더링
  return (
    <div className="flex items-center px-4 py-3 bg-white border-b border-gray-200 text-sm">
      {/* parts 배열의 각 항목을 순회하며 렌더링 */}
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {/* 첫 번째 항목이 아니면 구분자(›)를 앞에 표시 */}
          {index > 0 && <span className="mx-2 text-gray-300">›</span>}

          {/* onClick이 있으면 클릭 가능한 버튼으로 렌더링 */}
          {part.onClick ? (
            <button
              onClick={part.onClick}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {part.label}
            </button>
          ) : (
            // onClick이 없으면 일반 텍스트로 렌더링
            // 마지막 항목(현재 위치)은 진하게 표시하고, 나머지는 회색으로 표시
            <span
              className={
                index === parts.length - 1
                  ? "text-gray-900 font-medium"  // 마지막 항목: 검은색 + 굵게
                  : "text-gray-600"               // 나머지: 회색
              }
            >
              {part.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
