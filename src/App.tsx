/**
 * App 컴포넌트
 * - 애플리케이션의 최상위 컴포넌트
 * - 전체 레이아웃과 메타데이터 로딩을 담당
 * - 헤더, 사이드바, 캔버스로 구성된 레이아웃 제공
 */

import { useEffect } from "react";
import { useDrawingStore } from "./store/useDrawingStore";
import { useTheme } from "./hooks/useTheme";
import { useSidebar } from "./hooks/useSidebar";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { RevisionCompare } from "./components/RevisionCompare";
import { AnnotationPanel } from "./components/AnnotationPanel";

function App() {
  const {
    setMetadata,
    metadata,
    currentDrawingId,
    currentDiscipline,
    currentRevision,
    getCurrentDrawing,
  } = useDrawingStore();

  const { isDark, setIsDark } = useTheme();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  // 메타데이터 로드
  useEffect(() => {
    fetch("/data/metadata.json")
      .then((res) => res.json())
      .then((data) => setMetadata(data))
      .catch((err) => console.error("Failed to load metadata:", err));
  }, [setMetadata]);

  // 메타데이터 로딩 중
  if (!metadata) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            도면 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const isSiteMap = currentDrawingId === "00";
  const drawing = getCurrentDrawing();

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Header
        metadata={metadata}
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        isSiteMap={isSiteMap}
        currentDiscipline={currentDiscipline}
        currentRevision={currentRevision}
        drawingName={drawing?.name || null}
        onToggleSidebar={toggleSidebar}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={closeSidebar}
          />
        )}

        <Sidebar
          isSiteMap={isSiteMap}
          isMobile={true}
          sidebarOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <Sidebar isSiteMap={isSiteMap} isMobile={false} />

        <main className="flex-1 relative">
          <DrawingCanvas />
        </main>
      </div>

      <RevisionCompare />
    </div>
  );
}

export default App;
