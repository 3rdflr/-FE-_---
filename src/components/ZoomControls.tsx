import React from "react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  return (
    <div className="absolute top-16 right-0 flex flex-col gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <button
        onClick={onZoomIn}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        title="확대"
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v12m6-6H6"
          />
        </svg>
      </button>
      <button
        onClick={onReset}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-medium border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
        title="100%로 리셋"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        onClick={onZoomOut}
        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        title="축소"
      >
        <svg
          className="w-4 h-4 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18 12H6"
          />
        </svg>
      </button>
    </div>
  );
};
