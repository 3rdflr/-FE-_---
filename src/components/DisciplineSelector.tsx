/**
 * DisciplineSelector 컴포넌트
 * - 공종(건축, 구조, 설비 등) 선택 UI
 * - 영역(Region)이 있는 경우 영역 선택 UI도 표시
 * - 공종별로 다른 색상 테마 적용
 */

import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const DisciplineSelector: React.FC = () => {
  const {
    getCurrentDrawing,
    currentDiscipline,
    currentRegion,
    selectDiscipline,
    selectRegion,
    getCurrentDisciplineData,
  } = useDrawingStore();

  const drawing = getCurrentDrawing();
  const disciplineData = getCurrentDisciplineData();

  if (!drawing || !drawing.disciplines) return null;

  const disciplines = Object.keys(drawing.disciplines);
  const hasRegions = disciplineData?.regions;
  const regions = hasRegions ? Object.keys(disciplineData.regions!) : [];

  /**
   * 공종별 색상 테마 (라이트 + 다크)
   */
  const disciplineColors: Record<string, string> = {
    건축: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600",
    구조: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-600",
    공조설비: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600",
    배관설비: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-600",
    소방: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-600",
    설비: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-600",
    조경: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600",
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">공종 선택</h3>

      <div className="flex flex-wrap gap-2">
        {disciplines.map((discipline) => {
          const isActive = currentDiscipline === discipline;
          const colorClass =
            disciplineColors[discipline] ||
            "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";

          return (
            <button
              key={discipline}
              onClick={() => selectDiscipline(discipline)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-full border transition-all
                ${
                  isActive
                    ? colorClass + " ring-2 ring-offset-1 dark:ring-offset-gray-800"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }
              `}
            >
              {discipline}
            </button>
          );
        })}
      </div>

      {hasRegions && regions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
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
                      ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-400 dark:border-orange-600"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500"
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
