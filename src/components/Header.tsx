import React from "react";
import { Metadata } from "../types/metadata";
import { Breadcrumb } from "./Breadcrumb";

interface HeaderProps {
  metadata: Metadata;
  isDark: boolean;
  sidebarOpen: boolean;
  isSiteMap: boolean;
  currentDiscipline: string | null;
  currentRevision: string | null;
  drawingName: string | null;
  onToggleSidebar: () => void;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  isDark,
  sidebarOpen,
  isSiteMap,
  currentDiscipline,
  currentRevision,
  drawingName,
  onToggleSidebar,
  onToggleTheme,
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3 flex items-center gap-3">
        {/* 모바일 메뉴 토글 */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* 로고 아이콘 */}
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* 프로젝트 정보 */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">
            {metadata.project.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
            건설 도면 탐색기
          </p>
        </div>

        {/* 다크 모드 토글 버튼 */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
          title={isDark ? "라이트 모드" : "다크 모드"}
        >
          {isDark ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 브레드크럼 네비게이션 */}
      <Breadcrumb />

      {/* 모바일 핵심 정보 미니바 */}
      {!isSiteMap && drawingName && (currentDiscipline || currentRevision) && (
        <div className="md:hidden px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 overflow-x-auto">
          {currentDiscipline && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap flex-shrink-0">
              {currentDiscipline}
            </span>
          )}
          {currentRevision && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full whitespace-nowrap flex-shrink-0">
              {currentRevision}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-shrink-0">
            {drawingName}
          </span>
        </div>
      )}
    </header>
  );
};
