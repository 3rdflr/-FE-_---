/**
 * DisciplineSelector 컴포넌트
 * - 공종(건축, 구조, 설비 등) 선택 UI
 * - 영역(Region)이 있는 경우 영역 선택 UI도 표시
 * - 공종별로 다른 색상 테마 적용
 */

import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const DisciplineSelector: React.FC = () => {
  // 스토어에서 필요한 상태와 함수 가져오기
  const {
    getCurrentDrawing,              // 현재 도면 데이터 가져오기
    currentDiscipline,               // 현재 선택된 공종
    currentRegion,                   // 현재 선택된 영역
    selectDiscipline,                // 공종 선택 함수
    selectRegion,                    // 영역 선택 함수
    getCurrentDisciplineData,        // 현재 공종 데이터 가져오기
  } = useDrawingStore();

  const drawing = getCurrentDrawing();
  const disciplineData = getCurrentDisciplineData();

  // 도면이나 공종 정보가 없으면 아무것도 표시하지 않음
  if (!drawing || !drawing.disciplines) return null;

  // 현재 도면에서 사용 가능한 공종 목록
  const disciplines = Object.keys(drawing.disciplines);
  // 현재 공종에 영역(Region)이 있는지 확인
  const hasRegions = disciplineData?.regions;
  // 영역 목록 추출
  const regions = hasRegions ? Object.keys(disciplineData.regions!) : [];

  /**
   * 공종별 색상 테마
   * - 각 공종마다 고유한 색상으로 시각적 구분
   * - Tailwind CSS 클래스 사용
   */
  const disciplineColors: Record<string, string> = {
    건축: "bg-blue-100 text-blue-700 border-blue-300",       // 파란색
    구조: "bg-orange-100 text-orange-700 border-orange-300",  // 주황색
    공조설비: "bg-green-100 text-green-700 border-green-300",   // 녹색
    배관설비: "bg-purple-100 text-purple-700 border-purple-300", // 보라색
    소방: "bg-red-100 text-red-700 border-red-300",          // 빨간색
    설비: "bg-teal-100 text-teal-700 border-teal-300",       // 청록색
    조경: "bg-emerald-100 text-emerald-700 border-emerald-300", // 에메랄드색
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">공종 선택</h3>

      {/* 공종 버튼 목록 */}
      <div className="flex flex-wrap gap-2">
        {disciplines.map((discipline) => {
          const isActive = currentDiscipline === discipline;  // 현재 선택된 공종인지 확인
          // 공종에 맞는 색상 클래스 가져오기 (없으면 회색)
          const colorClass =
            disciplineColors[discipline] ||
            "bg-gray-100 text-gray-700 border-gray-300";

          return (
            <button
              key={discipline}
              onClick={() => selectDiscipline(discipline)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full border transition-all
                ${
                  isActive
                    ? colorClass + " ring-2 ring-offset-1"  // 활성 상태: 색상 + 링 효과
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"  // 비활성 상태: 회색
                }
              `}
            >
              {discipline}
            </button>
          );
        })}
      </div>

      {/* 영역 선택 섹션 (영역이 있는 경우에만 표시) */}
      {hasRegions && regions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            영역 선택
          </h4>
          <div className="flex gap-2">
            {regions.map((region) => (
              <button
                key={region}
                className={`
                  px-4 py-2 text-sm rounded-lg border-2 transition-all font-medium
                  ${
                    currentRegion === region
                      ? "bg-orange-50 text-orange-700 border-orange-400"  // 선택된 영역
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"  // 선택되지 않은 영역
                  }
                `}
                onClick={() => selectRegion(region)}
              >
                Region {region}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
