/**
 * App 컴포넌트
 * - 애플리케이션의 최상위 컴포넌트
 * - 전체 레이아웃과 메타데이터 로딩을 담당
 * - 헤더, 사이드바, 캔버스로 구성된 레이아웃 제공
 */

import { useEffect } from "react";
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
  const { setMetadata, metadata, currentDrawingId } = useDrawingStore();

  // 컴포넌트 마운트 시 메타데이터 로드
  useEffect(() => {
    fetch("/data/metadata.json")  // public 폴더의 metadata.json 파일 가져오기
      .then((res) => res.json())
      .then((data) => setMetadata(data))  // 스토어에 메타데이터 저장
      .catch((err) => console.error("Failed to load metadata:", err));
  }, [setMetadata]);

  // 메타데이터 로딩 중일 때 로딩 화면 표시
  if (!metadata) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">도면 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 현재 전체 배치도("00")를 보고 있는지 확인
  const isSiteMap = currentDrawingId === "00";

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ===== 헤더 영역 ===== */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
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
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {metadata.project.name}
            </h1>
            <p className="text-xs text-gray-500">건설 도면 탐색기</p>
          </div>
        </div>
        {/* 브레드크럼 네비게이션 */}
        <Breadcrumb />
      </header>

      {/* ===== 메인 컨텐츠 영역 ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* 사이드바 (왼쪽) */}
        <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
          {/* 공간 트리 (항상 표시) */}
          <SpaceTree />

          {/* 상세 도면 패널 (배치도가 아닐 때만 표시) */}
          {!isSiteMap && (
            <>
              <DisciplineSelector />  {/* 공종 선택 */}
              <RevisionTimeline />    {/* 리비전 타임라인 */}
              <LayerPanel />          {/* 레이어 패널 */}
              <InfoPanel />           {/* 정보 패널 */}
            </>
          )}

          {/* 배치도 안내 (배치도일 때만 표시) */}
          {isSiteMap && (
            <div className="p-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  전체 배치도
                </h4>
                <p className="text-xs text-blue-600">
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
