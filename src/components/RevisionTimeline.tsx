import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const RevisionTimeline: React.FC = () => {
  const { getAvailableRevisions, currentRevision, selectRevision } =
    useDrawingStore();

  const revisions = getAvailableRevisions();

  if (revisions.length === 0) return null;

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-4">리비전 이력</h3>

      <div className="relative">
        {/* 타임라인 라인 */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />

        <div className="space-y-4">
          {revisions.map((revision, index) => {
            const isActive = revision.version === currentRevision;
            const isLatest = index === revisions.length - 1;

            return (
              <div
                key={revision.version}
                className="relative flex items-start cursor-pointer group"
                onClick={() => selectRevision(revision.version)}
              >
                {/* 타임라인 점 */}
                <div
                  className={`
                    relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center
                    transition-all
                    ${
                      isActive
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 group-hover:border-blue-400"
                    }
                  `}
                >
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>

                {/* 내용 */}
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        text-sm font-semibold
                        ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"}
                      `}
                    >
                      {revision.version}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full">
                        최신
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {revision.date}
                  </div>

                  {isActive && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                        {revision.description}
                      </p>
                      {revision.changes.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {revision.changes.map((change, i) => (
                            <li
                              key={i}
                              className="text-xs text-gray-500 dark:text-gray-400 flex items-start"
                            >
                              <span className="text-blue-400 mr-1">•</span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
