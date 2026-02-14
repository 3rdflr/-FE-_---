import React from "react";
import type { Annotation } from "../types/annotation";

interface DeleteAnnotationModalProps {
  isOpen: boolean;
  annotation: Annotation | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAnnotationModal: React.FC<DeleteAnnotationModalProps> = ({
  isOpen,
  annotation,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !annotation) return null;

  const getAnnotationPreview = () => {
    switch (annotation.type) {
      case "text":
        return `텍스트: "${(annotation.data as any).text}"`;
      case "arrow":
        return "화살표";
      case "rectangle":
        return "사각형";
      case "circle":
        return "원";
      default:
        return "주석";
    }
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onCancel}
      />

      {/* 삭제 확인 모달 */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-red-500
                   left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          minWidth: "300px",
          maxWidth: "400px",
        }}
      >
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              주석 삭제
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              다음 주석을 삭제하시겠습니까?
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2">
              {getAnnotationPreview()}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300
                       bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                       rounded transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600
                       rounded transition-colors"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
