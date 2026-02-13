import React from "react";
import { useDrawingStore } from "../store/useDrawingStore";

export const LayerPanel: React.FC = () => {
  const {
    getCurrentDrawing,
    currentDiscipline,
    layers,
    toggleLayer,
    setLayerOpacity,
    selectedLayer,
    setSelectedLayer,
    resetLayerOffset,
    resetAllLayerOffsets,
    toggleLayerLock,
    bringLayerToFront,
    sendLayerToBack,
  } = useDrawingStore();

  const drawing = getCurrentDrawing();

  if (!drawing || !drawing.disciplines) return null;

  const availableDisciplines = Object.keys(drawing.disciplines).filter(
    (d) => d !== currentDiscipline,
  );

  const visibleLayers = layers.filter((l) => l.visible);

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">레이어 오버레이</h3>
        {visibleLayers.length > 0 && (
          <button
            onClick={resetAllLayerOffsets}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            title="모든 레이어 위치 리셋"
          >
            모두 정렬
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        다른 공종을 겹쳐서 확인하세요
      </p>

      <div className="space-y-2">
        {availableDisciplines.map((discipline) => {
          const layer = layers.find((l) => l.discipline === discipline);
          const isVisible = layer?.visible || false;
          const opacity = layer?.opacity || 70;
          const isSelected = selectedLayer === discipline;
          const isLocked = layer?.locked || false;
          const hasOffset =
            layer && (layer.offsetX !== 0 || layer.offsetY !== 0);

          return (
            <div
              key={discipline}
              className={`rounded-lg border transition-all ${
                isSelected
                  ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {/* 메인 토글 */}
              <div className="flex items-center p-2">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleLayer(discipline)}
                  className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span
                  className={`flex-1 text-sm cursor-pointer ${
                    isVisible ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-500 dark:text-gray-400"
                  }`}
                  onClick={() => {
                    if (isVisible) {
                      setSelectedLayer(isSelected ? null : discipline);
                    }
                  }}
                >
                  {discipline}
                </span>

                {isVisible && (
                  <div className="flex items-center gap-1">
                    {/* 잠금 토글 */}
                    <button
                      onClick={() => toggleLayerLock(discipline)}
                      className={`p-1 rounded transition-colors ${
                        isLocked
                          ? "text-red-500 bg-red-50 dark:bg-red-900/30"
                          : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                      }`}
                      title={isLocked ? "잠금 해제" : "레이어 잠금"}
                    >
                      {isLocked ? (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                        </svg>
                      )}
                    </button>

                    {/* 선택 표시 */}
                    {isSelected && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                )}
              </div>

              {/* 확장 컨트롤 (보이는 레이어만) */}
              {isVisible && (
                <div className="px-2 pb-2 space-y-2">
                  {/* 투명도 슬라이더 */}
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12">투명도</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) =>
                        setLayerOpacity(discipline, Number(e.target.value))
                      }
                      className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                      {opacity}%
                    </span>
                  </div>

                  {/* 레이어 컨트롤 버튼들 */}
                  <div className="flex items-center gap-1 ml-6">
                    <button
                      onClick={() => sendLayerToBack(discipline)}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="맨 뒤로"
                    >
                      ↓ 뒤로
                    </button>
                    <button
                      onClick={() => bringLayerToFront(discipline)}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="맨 앞으로"
                    >
                      ↑ 앞으로
                    </button>
                    {hasOffset && (
                      <button
                        onClick={() => resetLayerOffset(discipline)}
                        className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="위치 리셋"
                      >
                        ⟲ 정렬
                      </button>
                    )}
                  </div>

                  {/* 오프셋 표시 */}
                  {hasOffset && (
                    <div className="ml-6 text-xs text-gray-400 dark:text-gray-500">
                      오프셋: ({Math.round(layer.offsetX)},{" "}
                      {Math.round(layer.offsetY)})
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {availableDisciplines.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          오버레이할 공종이 없습니다
        </p>
      )}

      {/* 사용 안내 */}
      {visibleLayers.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            💡 <strong>Tip:</strong> 레이어를 클릭하여 선택 후,
            <br />
            캔버스에서 <kbd className="px-1 bg-gray-200 dark:bg-gray-600 rounded">Shift</kbd> +
            드래그로 이동
          </p>
        </div>
      )}
    </div>
  );
};
