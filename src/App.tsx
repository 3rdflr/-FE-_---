/**
 * App 컴포넌트
 * - 애플리케이션의 최상위 컴포넌트
 * - 전체 레이아웃과 메타데이터 로딩을 담당
 * - 헤더, 사이드바, 캔버스로 구성된 레이아웃 제공
 * - 다크 모드 토글 및 반응형 사이드바 지원
 */

import { useEffect, useState } from "react";
import { useDrawingStore } from "./store/useDrawingStore";
import { Breadcrumb } from "./components/Breadcrumb";
import { SpaceTree } from "./components/SpaceTree";
import { DisciplineSelector } from "./components/DisciplineSelector";
import { RevisionTimeline } from "./components/RevisionTimeline";
import { InfoPanel } from "./components/InfoPanel";
import { LayerPanel } from "./components/LayerPanel";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { RevisionCompare } from "./components/RevisionCompare";

function App() {
  // 스토어에서 필요한 상태와 함수 가져오기
  const {
    setMetadata,
    metadata,
    currentDrawingId,
    currentDiscipline,
    currentRevision,
    getCurrentDrawing,
  } = useDrawingStore();

  // 다크 모드 상태 (localStorage 또는 OS 설정 기반 초기화)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // 모바일 사이드바 열림/닫힘 상태
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 다크 모드 토글 시 DOM과 localStorage에 반영
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // 컴포넌트 마운트 시 메타데이터 로드
  useEffect(() => {
    fetch("/data/metadata.json") // public 폴더의 metadata.json 파일 가져오기
      .then((res) => res.json())
      .then((data) => setMetadata(data)) // 스토어에 메타데이터 저장
      .catch((err) => console.error("Failed to load metadata:", err));
  }, [setMetadata]);

  // 메타데이터 로딩 중일 때 로딩 화면 표시
  if (!metadata) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            도면 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 현재 전체 배치도("00")를 보고 있는지 확인
  const isSiteMap = currentDrawingId === "00";
  const drawing = getCurrentDrawing();

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* ===== 헤더 영역 ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* 모바일 메뉴 토글 (상단 드롭다운) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
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
            onClick={() => setIsDark(!isDark)}
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

        {/* 모바일 핵심 정보 미니바 (메뉴 닫혀있을 때도 표시) */}
        {!isSiteMap && drawing && (currentDiscipline || currentRevision) && (
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
              {drawing.name}
            </span>
          </div>
        )}
      </header>

      {/* ===== 메인 컨텐츠 영역 ===== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 모바일 드롭다운 백드롭 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 모바일: 상단 드롭다운 메뉴 (열려있을 때만 렌더링) */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed left-0 right-0 z-40 bg-white dark:bg-gray-800 shadow-lg"
            style={{ top: "auto" }}
          >
            {/* 스크롤 영역 */}
            <div className="overflow-y-auto max-h-[calc(70vh-2.5rem)]">
              {/* 공간 트리 */}
              <SpaceTree />

              {/* 상세 도면 패널 */}
              {!isSiteMap && (
                <>
                  <DisciplineSelector />
                  <RevisionTimeline />
                  <LayerPanel />
                  <InfoPanel />
                </>
              )}

              {/* 배치도 안내 */}
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
            </div>

            {/* 하단 마감 - 그라데이션 + 핸들바 */}
            <div className="relative border-t border-gray-200 dark:border-gray-700">
              <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-full py-2 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* 데스크톱: 사이드바 (왼쪽) */}
        <aside className="hidden md:block w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto flex-shrink-0">
          {/* 공간 트리 (항상 표시) */}
          <SpaceTree />

          {/* 상세 도면 패널 (배치도가 아닐 때만 표시) */}
          {!isSiteMap && (
            <>
              <DisciplineSelector /> {/* 공종 선택 */}
              <RevisionTimeline /> {/* 리비전 타임라인 */}
              <LayerPanel /> {/* 레이어 패널 */}
              <InfoPanel /> {/* 정보 패널 */}
            </>
          )}

          {/* 배치도 안내 (배치도일 때만 표시) */}
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
        </aside>

        {/* 메인 캔버스 영역 (오른쪽) */}
        <main className="flex-1 relative">
          <DrawingCanvas />
        </main>
      </div>

      {/* 리비전 비교 모달 (필요시 표시) */}
      <RevisionCompare />
    </div>
  );
}

export default App;
