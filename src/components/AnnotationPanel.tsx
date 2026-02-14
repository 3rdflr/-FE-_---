import React from "react";
import { useAnnotationStore } from "../store/useAnnotationStore";
import { useDrawingStore } from "../store/useDrawingStore";

export const AnnotationPanel: React.FC = () => {
  const { currentDrawingId, currentDiscipline, currentRevision } = useDrawingStore();
  const {
    getAnnotationsForCurrentDrawing,
    deleteAnnotation,
    selectedAnnotationId,
    setSelectedAnnotation,
  } = useAnnotationStore();

  if (!currentDrawingId) return null;

  const annotations = getAnnotationsForCurrentDrawing(
    currentDrawingId,
    currentDiscipline,
    currentRevision
  );

  if (annotations.length === 0) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: "텍스트",
      arrow: "화살표",
      rectangle: "사각형",
      circle: "원",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          주석 목록
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {annotations.length}개
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {annotations.map((annotation) => {
          const isSelected = selectedAnnotationId === annotation.id;

          return (
            <div
              key={annotation.id}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedAnnotation(isSelected ? null : annotation.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {getTypeLabel(annotation.type)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(annotation.createdAt)}
                    </span>
                  </div>

                  {annotation.type === "text" && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {(annotation.data as any).text}
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  title="삭제"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
