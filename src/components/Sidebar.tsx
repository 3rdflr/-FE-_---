import React from "react";
import { SpaceTree } from "./SpaceTree";
import { DisciplineSelector } from "./DisciplineSelector";
import { RevisionTimeline } from "./RevisionTimeline";
import { LayerPanel } from "./LayerPanel";
import { InfoPanel } from "./InfoPanel";

interface SidebarProps {
  isSiteMap: boolean;
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSiteMap,
  isMobile = false,
  sidebarOpen = false,
  onClose,
}) => {
  const content = (
    <>
      <SpaceTree />
      {!isSiteMap && (
        <>
          <DisciplineSelector />
          <RevisionTimeline />
          <LayerPanel />
          <InfoPanel />
        </>
      )}
      {isSiteMap && (
        <div className="p-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              전체 배치도
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              건물을 클릭하여 상세 도면으로 이동하세요.
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (isMobile && sidebarOpen) {
    return (
      <div
        className="md:hidden fixed left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-lg"
        style={{ top: "auto" }}
      >
        <div className="overflow-y-auto max-h-[calc(70vh-2.5rem)]">
          {content}
        </div>
        <div className="relative border-t border-gray-200 dark:border-gray-700">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            className="w-full py-2 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </button>
        </div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <aside className="hidden md:block w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
        {content}
      </aside>
    );
  }

  return null;
};
