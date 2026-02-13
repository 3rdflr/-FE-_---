import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const InfoPanel: React.FC = () => {
  const {
    getCurrentDrawing,
    getCurrentRevisionData,
    currentDiscipline,
    currentRegion,
    currentRevision,
  } = useDrawingStore();

  const drawing = getCurrentDrawing();
  const revisionData = getCurrentRevisionData();

  if (!drawing) return null;

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">도면 정보</h3>

      <div className="space-y-3">
        <InfoRow label="건물" value={drawing.name} />

        {currentDiscipline && (
          <InfoRow label="공종" value={currentDiscipline} />
        )}

        {currentRegion && (
          <InfoRow label="영역" value={`Region ${currentRegion}`} />
        )}

        {currentRevision && (
          <InfoRow label="리비전" value={currentRevision} highlight />
        )}

        {revisionData && (
          <>
            <InfoRow label="발행일" value={revisionData.date} />
            <InfoRow label="설명" value={revisionData.description} />

            {revisionData.changes.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-600">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  변경 내역
                </div>
                <ul className="space-y-1">
                  {revisionData.changes.map((change, i) => (
                    <li
                      key={i}
                      className="text-xs text-gray-600 dark:text-gray-400 flex items-start"
                    >
                      <span className="text-blue-400 mr-1.5">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const InfoRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div>
    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">{label}</div>
    <div
      className={`text-sm ${
        highlight ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-800 dark:text-gray-200"
      }`}
    >
      {value}
    </div>
  </div>
);
