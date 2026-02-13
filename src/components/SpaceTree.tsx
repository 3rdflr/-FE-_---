import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const SpaceTree: React.FC = () => {
  const { metadata, currentDrawingId, selectDrawing } = useDrawingStore();

  if (!metadata) return null;

  const buildings = Object.values(metadata.drawings).filter(
    (d) => d.parent === "00",
  );
  const siteMap = metadata.drawings["00"];

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">공간 탐색</h3>

      {/* 전체 배치도 */}
      <div
        className={`
          px-3 py-2 my-1 rounded-lg cursor-pointer transition-all
          flex items-center text-sm
          ${
            currentDrawingId === "00"
              ? "bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
              : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent"
          }
        `}
        onClick={() => selectDrawing("00")}
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        {siteMap?.name || "전체 배치도"}
      </div>

      {/* 건물 목록 */}
      <div className="ml-4 mt-2 border-l-2 border-gray-200 dark:border-gray-600 pl-2">
        {buildings.map((building) => (
          <div
            key={building.id}
            className={`
              px-3 py-2 my-1 rounded-lg cursor-pointer transition-all
              flex items-center text-sm
              ${
                currentDrawingId === building.id
                  ? "bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-transparent"
              }
            `}
            onClick={() => selectDrawing(building.id)}
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            {building.name}
          </div>
        ))}
      </div>
    </div>
  );
};
