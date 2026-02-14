import React, { useState } from "react";
import { useAnnotationStore } from "../store/useAnnotationStore";
import type { AnnotationTool } from "../types/annotation";

export const AnnotationToolbar: React.FC = () => {
  const {
    isAnnotationMode,
    setAnnotationMode,
    currentTool,
    setCurrentTool,
    textSettings,
    arrowSettings,
    shapeSettings,
    updateTextSettings,
    updateArrowSettings,
    updateShapeSettings,
  } = useAnnotationStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAnnotationMode = () => {
    const newMode = !isAnnotationMode;
    setAnnotationMode(newMode);
    if (!newMode) {
      setCurrentTool(null);
      setIsExpanded(false);
    }
  };

  const selectTool = (tool: AnnotationTool) => {
    if (!isAnnotationMode) {
      setAnnotationMode(true);
    }
    setCurrentTool(currentTool === tool ? null : tool);
  };

  const tools: { type: AnnotationTool; label: string; icon: JSX.Element }[] = [
    {
      type: "text",
      label: "텍스트",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      type: "arrow",
      label: "화살표",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
    },
    {
      type: "rectangle",
      label: "사각형",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" strokeWidth={2} rx="2" />
        </svg>
      ),
    },
    {
      type: "circle",
      label: "원",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth={2} />
        </svg>
      ),
    },
    {
      type: "delete" as AnnotationTool,
      label: "삭제",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  const colors = [
    { value: "#ef4444", label: "빨강" },
    { value: "#3b82f6", label: "파랑" },
    { value: "#10b981", label: "초록" },
    { value: "#f59e0b", label: "주황" },
    { value: "#8b5cf6", label: "보라" },
    { value: "#000000", label: "검정" },
  ];

  const fontSizes = [12, 14, 16, 18, 20];
  const lineWidths = [2, 3, 4, 5];

  return (
    <>
      {/* 모바일 버전 - 컴팩트 */}
      <div className="md:hidden absolute top-4 left-4 z-10 max-w-[280px]">
        {/* 주석 모드 활성화 시 확장 메뉴 */}
        {isAnnotationMode ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* 주석 모드 토글 버튼 */}
            <button
              onClick={toggleAnnotationMode}
              className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-t-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm font-medium">주석</span>
            </button>

            {/* 도구 선택 (가로 배치) */}
            <div className="flex gap-1 p-2 border-t border-gray-200 dark:border-gray-600">
              {tools.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => selectTool(tool.type)}
                  className={`flex flex-col items-center justify-center gap-1 rounded transition-colors ${
                    currentTool === tool.type
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                  style={{ width: "50px", height: "55px" }}
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="text-[10px]">{tool.label}</span>
                </button>
              ))}
            </div>

            {/* 설정 확장/축소 버튼 */}
            {currentTool && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600"
              >
                {isExpanded ? "설정 닫기 ▲" : "설정 열기 ▼"}
              </button>
            )}

            {/* 확장된 설정 */}
            {currentTool && isExpanded && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-600 space-y-2 max-h-[40vh] overflow-y-auto">
                {/* 색상 선택 */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    색상
                  </label>
                  <div className="grid grid-cols-6 gap-1">
                    {colors.map((color) => {
                      const currentColor =
                        currentTool === "text"
                          ? textSettings.color
                          : currentTool === "arrow"
                            ? arrowSettings.color
                            : shapeSettings.color;

                      return (
                        <button
                          key={color.value}
                          onClick={() => {
                            if (currentTool === "text") updateTextSettings({ color: color.value });
                            else if (currentTool === "arrow") updateArrowSettings({ color: color.value });
                            else updateShapeSettings({ color: color.value });
                          }}
                          className={`w-8 h-8 rounded border-2 transition-all ${
                            currentColor === color.value
                              ? "border-blue-500 scale-110"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* 텍스트 전용 설정 */}
                {currentTool === "text" && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                      글자 크기
                    </label>
                    <div className="flex gap-1">
                      {fontSizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => updateTextSettings({ fontSize: size })}
                          className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            textSettings.fontSize === size
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 화살표/도형 전용 설정 */}
                {(currentTool === "arrow" || currentTool === "rectangle" || currentTool === "circle") && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                      선 굵기
                    </label>
                    <div className="flex gap-1">
                      {lineWidths.map((width) => {
                        const currentWidth =
                          currentTool === "arrow" ? arrowSettings.lineWidth : shapeSettings.lineWidth;

                        return (
                          <button
                            key={width}
                            onClick={() => {
                              if (currentTool === "arrow") updateArrowSettings({ lineWidth: width });
                              else updateShapeSettings({ lineWidth: width });
                            }}
                            className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                              currentWidth === width
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {width}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 도형 채우기 옵션 */}
                {(currentTool === "rectangle" || currentTool === "circle") && (
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shapeSettings.fill}
                        onChange={(e) => updateShapeSettings({ fill: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span>채우기</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={toggleAnnotationMode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg transition-colors bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-sm font-medium">주석</span>
          </button>
        )}
      </div>

      {/* 데스크톱 버전 - 원본 UI */}
      <div className="hidden md:flex absolute top-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex-col gap-2 z-10">
        {/* 주석 모드 토글 */}
      <button
        onClick={toggleAnnotationMode}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          isAnnotationMode
            ? "bg-blue-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
        title="주석 모드"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span className="text-sm font-medium">주석</span>
      </button>

      {isAnnotationMode && (
        <>
          {/* 구분선 */}
          <div className="h-px bg-gray-200 dark:bg-gray-600" />

          {/* 도구 선택 */}
          <div className="flex flex-col gap-1">
            {tools.map((tool) => (
              <button
                key={tool.type}
                onClick={() => selectTool(tool.type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  currentTool === tool.type
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={tool.label}
              >
                {tool.icon}
                <span className="text-sm">{tool.label}</span>
              </button>
            ))}
          </div>

          {/* 도구별 설정 */}
          {currentTool && (
            <>
              <div className="h-px bg-gray-200 dark:bg-gray-600" />

              {/* 색상 선택 */}
              <div className="px-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                  색상
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {colors.map((color) => {
                    const currentColor =
                      currentTool === "text"
                        ? textSettings.color
                        : currentTool === "arrow"
                          ? arrowSettings.color
                          : shapeSettings.color;

                    return (
                      <button
                        key={color.value}
                        onClick={() => {
                          if (currentTool === "text") updateTextSettings({ color: color.value });
                          else if (currentTool === "arrow") updateArrowSettings({ color: color.value });
                          else updateShapeSettings({ color: color.value });
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          currentColor === color.value
                            ? "border-blue-500 scale-110"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    );
                  })}
                </div>
              </div>

              {/* 텍스트 전용 설정 */}
              {currentTool === "text" && (
                <div className="px-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    글자 크기
                  </label>
                  <div className="flex gap-1">
                    {fontSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => updateTextSettings({ fontSize: size })}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          textSettings.fontSize === size
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 화살표/도형 전용 설정 */}
              {(currentTool === "arrow" || currentTool === "rectangle" || currentTool === "circle") && (
                <div className="px-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    선 굵기
                  </label>
                  <div className="flex gap-1">
                    {lineWidths.map((width) => {
                      const currentWidth =
                        currentTool === "arrow" ? arrowSettings.lineWidth : shapeSettings.lineWidth;

                      return (
                        <button
                          key={width}
                          onClick={() => {
                            if (currentTool === "arrow") updateArrowSettings({ lineWidth: width });
                            else updateShapeSettings({ lineWidth: width });
                          }}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            currentWidth === width
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {width}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 도형 채우기 옵션 */}
              {(currentTool === "rectangle" || currentTool === "circle") && (
                <div className="px-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shapeSettings.fill}
                      onChange={(e) => updateShapeSettings({ fill: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span>채우기</span>
                  </label>
                </div>
              )}
            </>
          )}
        </>
      )}
      </div>
    </>
  );
};
