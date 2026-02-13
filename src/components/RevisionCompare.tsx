import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDrawingStore } from "../store/useDrawingStore";
import type { Revision } from "../types/metadata";

type CompareMode = "side-by-side" | "overlay" | "slider";

interface PrerenderedImages {
  canvas1: OffscreenCanvas | null;
  canvas2: OffscreenCanvas | null;
  scale: number;
  centerX: number;
  centerY: number;
  img1Width: number;
  img1Height: number;
  img2Width: number;
  img2Height: number;
}

export const RevisionCompare: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CompareMode>("side-by-side");
  const [selectedRevisions, setSelectedRevisions] = useState<
    [string | null, string | null]
  >([null, null]);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Offscreen Canvas 캐시
  const prerenderedRef = useRef<PrerenderedImages>({
    canvas1: null,
    canvas2: null,
    scale: 1,
    centerX: 0,
    centerY: 0,
    img1Width: 0,
    img1Height: 0,
    img2Width: 0,
    img2Height: 0,
  });

  // 캔버스 크기 캐시
  const canvasSizeRef = useRef({ width: 0, height: 0 });

  // RAF ID
  const rafIdRef = useRef<number | null>(null);

  const { getAvailableRevisions, loadImage } = useDrawingStore();
  const revisions = getAvailableRevisions();

  // 모달 열릴 때 캐시 클리어 및 상태 초기화
  useEffect(() => {
    if (isOpen) {
      // Offscreen Canvas 캐시 클리어 (중요!)
      prerenderedRef.current = {
        canvas1: null,
        canvas2: null,
        scale: 1,
        centerX: 0,
        centerY: 0,
        img1Width: 0,
        img1Height: 0,
        img2Width: 0,
        img2Height: 0,
      };

      // 리비전 선택 초기화
      if (revisions.length >= 2) {
        setSelectedRevisions([
          revisions[0].version,
          revisions[revisions.length - 1].version,
        ]);
      }

      setSliderPosition(50);
    }
  }, [isOpen]);

  // revisions 변경 시 선택 업데이트
  useEffect(() => {
    if (revisions.length >= 2) {
      setSelectedRevisions([
        revisions[0].version,
        revisions[revisions.length - 1].version,
      ]);
    }
  }, [revisions.length]);

  // Offscreen Canvas에 이미지 미리 렌더링
  const prerenderImages = useCallback(
    async (rev1: Revision, rev2: Revision, width: number, height: number) => {
      try {
        const [img1, img2] = await Promise.all([
          loadImage(rev1.image),
          loadImage(rev2.image),
        ]);

        const maxWidth = Math.max(img1.width, img2.width);
        const maxHeight = Math.max(img1.height, img2.height);
        const scale = Math.min(
          (width * 0.85) / maxWidth,
          (height * 0.85) / maxHeight,
        );
        const centerX = width / 2;
        const centerY = height / 2;

        // 동일한 렌더링 크기 (두 이미지 모두 같은 크기로 표시)
        const renderWidth = maxWidth * scale;
        const renderHeight = maxHeight * scale;

        // Offscreen Canvas 생성 및 이미지 렌더링
        const dpr = window.devicePixelRatio || 1;

        const offscreen1 = new OffscreenCanvas(width * dpr, height * dpr);
        const ctx1 = offscreen1.getContext("2d")!;
        ctx1.scale(dpr, dpr);
        ctx1.drawImage(
          img1,
          centerX - renderWidth / 2,
          centerY - renderHeight / 2,
          renderWidth,
          renderHeight,
        );

        const offscreen2 = new OffscreenCanvas(width * dpr, height * dpr);
        const ctx2 = offscreen2.getContext("2d")!;
        ctx2.scale(dpr, dpr);
        ctx2.drawImage(
          img2,
          centerX - renderWidth / 2,
          centerY - renderHeight / 2,
          renderWidth,
          renderHeight,
        );

        prerenderedRef.current = {
          canvas1: offscreen1,
          canvas2: offscreen2,
          scale,
          centerX,
          centerY,
          img1Width: img1.width,
          img1Height: img1.height,
          img2Width: img2.width,
          img2Height: img2.height,
        };

        return true;
      } catch (error) {
        console.error("Failed to prerender images:", error);
        return false;
      }
    },
    [loadImage],
  );

  // 슬라이더 렌더링 (Offscreen Canvas 사용)
  const renderSlider = useCallback((position: number) => {
    const canvas = overlayCanvasRef.current;
    const { canvas1, canvas2 } = prerenderedRef.current;

    if (!canvas || !canvas1 || !canvas2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSizeRef.current;
    const dpr = window.devicePixelRatio || 1;
    const splitX = (width * position) / 100;

    // 캔버스 전체 클리어 (잔상 방지)
    ctx.clearRect(0, 0, width, height);

    ctx.save();

    // 왼쪽 영역 (rev1)
    ctx.beginPath();
    ctx.rect(0, 0, splitX, height);
    ctx.clip();
    ctx.drawImage(
      canvas1,
      0,
      0,
      width * dpr,
      height * dpr,
      0,
      0,
      width,
      height,
    );
    ctx.restore();

    ctx.save();
    // 오른쪽 영역 (rev2)
    ctx.beginPath();
    ctx.rect(splitX, 0, width - splitX, height);
    ctx.clip();
    ctx.drawImage(
      canvas2,
      0,
      0,
      width * dpr,
      height * dpr,
      0,
      0,
      width,
      height,
    );
    ctx.restore();

    // 슬라이더 라인
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, height);
    ctx.stroke();

    // 슬라이더 핸들
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(splitX, height / 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // 핸들 테두리
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.stroke();

    // 화살표 아이콘
    ctx.fillStyle = "white";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("◀▶", splitX, height / 2);
  }, []);

  // 오버레이 렌더링
  const renderOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const { canvas1, canvas2 } = prerenderedRef.current;

    if (!canvas || !canvas1 || !canvas2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      canvas1,
      0,
      0,
      width * dpr,
      height * dpr,
      0,
      0,
      width,
      height,
    );
    ctx.globalAlpha = 0.5;
    ctx.drawImage(
      canvas2,
      0,
      0,
      width * dpr,
      height * dpr,
      0,
      0,
      width,
      height,
    );
    ctx.globalAlpha = 1;
  }, []);

  // 캔버스 설정
  const setupCanvas = useCallback((canvas: HTMLCanvasElement) => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    canvasSizeRef.current = { width: rect.width, height: rect.height };
    return { width: rect.width, height: rect.height };
  }, []);

  // Side-by-side 렌더링
  const renderSideBySide = useCallback(
    async (rev1: Revision, rev2: Revision) => {
      const leftCanvas = leftCanvasRef.current;
      const rightCanvas = rightCanvasRef.current;

      if (!leftCanvas || !rightCanvas) return;

      const leftCtx = leftCanvas.getContext("2d");
      const rightCtx = rightCanvas.getContext("2d");

      if (!leftCtx || !rightCtx) return;

      const leftSize = setupCanvas(leftCanvas);
      const rightSize = setupCanvas(rightCanvas);

      try {
        const [img1, img2] = await Promise.all([
          loadImage(rev1.image),
          loadImage(rev2.image),
        ]);

        // 두 이미지 중 큰 것을 기준으로 동일한 스케일 계산
        const maxWidth = Math.max(img1.width, img2.width);
        const maxHeight = Math.max(img1.height, img2.height);

        const scale1 = Math.min(
          (leftSize.width * 0.85) / maxWidth,
          (leftSize.height * 0.85) / maxHeight,
        );
        const scale2 = Math.min(
          (rightSize.width * 0.85) / maxWidth,
          (rightSize.height * 0.85) / maxHeight,
        );

        // 동일한 스케일 사용 (둘 중 작은 값)
        const uniformScale = Math.min(scale1, scale2);

        // 동일한 렌더링 크기 (두 이미지 모두 같은 크기로 표시)
        const renderWidth = maxWidth * uniformScale;
        const renderHeight = maxHeight * uniformScale;

        const x1 = (leftSize.width - renderWidth) / 2;
        const y1 = (leftSize.height - renderHeight) / 2;

        leftCtx.clearRect(0, 0, leftSize.width, leftSize.height);
        leftCtx.drawImage(
          img1,
          x1,
          y1,
          renderWidth,
          renderHeight,
        );

        const x2 = (rightSize.width - renderWidth) / 2;
        const y2 = (rightSize.height - renderHeight) / 2;

        rightCtx.clearRect(0, 0, rightSize.width, rightSize.height);
        rightCtx.drawImage(
          img2,
          x2,
          y2,
          renderWidth,
          renderHeight,
        );
      } catch (error) {
        console.error("Failed to render comparison:", error);
      }
    },
    [loadImage, setupCanvas],
  );

  // 초기 렌더링 및 모드/선택 변경 시
  useEffect(() => {
    if (!isOpen || !selectedRevisions[0] || !selectedRevisions[1]) return;

    const rev1 = revisions.find((r) => r.version === selectedRevisions[0]);
    const rev2 = revisions.find((r) => r.version === selectedRevisions[1]);

    if (!rev1 || !rev2) return;

    // 모달 열릴 때 DOM이 준비될 시간을 충분히 줌
    const timer = setTimeout(async () => {
      if (mode === "side-by-side") {
        await renderSideBySide(rev1, rev2);
      } else {
        const canvas = overlayCanvasRef.current;
        if (!canvas) return;

        const { width, height } = setupCanvas(canvas);

        // 캔버스 크기가 유효한지 확인
        if (width <= 0 || height <= 0) return;

        const success = await prerenderImages(rev1, rev2, width, height);

        if (success) {
          if (mode === "slider") {
            renderSlider(sliderPosition);
          } else {
            renderOverlay();
          }
        }
      }
    }, 150); // 150ms로 증가

    return () => clearTimeout(timer);
  }, [
    isOpen,
    mode,
    selectedRevisions,
    revisions,
    setupCanvas,
    prerenderImages,
    renderSideBySide,
    renderSlider,
    renderOverlay,
    sliderPosition,
  ]);

  // 슬라이더 위치 변경 시 (RAF 사용)
  useEffect(() => {
    if (mode !== "slider" || !isOpen) return;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      renderSlider(sliderPosition);
    });

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [sliderPosition, mode, isOpen, renderSlider]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== "slider") return;
      setIsDragging(true);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSliderPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
    },
    [mode],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (mode !== "slider" || !isDragging) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      setSliderPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
    },
    [mode, isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (mode !== "slider") return;
      e.preventDefault();
      setIsDragging(true);

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      setSliderPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
    },
    [mode],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (mode !== "slider" || !isDragging) return;
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      setSliderPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
    },
    [mode, isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (revisions.length < 2) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors z-50 flex items-center gap-2"
      >
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        리비전 비교
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">리비전 비교</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-6 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">기준:</label>
            <select
              value={selectedRevisions[0] || ""}
              onChange={(e) =>
                setSelectedRevisions([e.target.value, selectedRevisions[1]])
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {revisions.map((rev) => (
                <option key={rev.version} value={rev.version}>
                  {rev.version} ({rev.date})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">비교:</label>
            <select
              value={selectedRevisions[1] || ""}
              onChange={(e) =>
                setSelectedRevisions([selectedRevisions[0], e.target.value])
              }
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {revisions.map((rev) => (
                <option key={rev.version} value={rev.version}>
                  {rev.version} ({rev.date})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(["side-by-side", "overlay", "slider"] as CompareMode[]).map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    mode === m
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {m === "side-by-side"
                    ? "나란히"
                    : m === "overlay"
                      ? "겹쳐보기"
                      : "슬라이더"}
                </button>
              ),
            )}
          </div>

          {mode === "slider" && (
            <div className="text-xs text-gray-500 ml-auto">
              💡 드래그하여 비교 영역 조절
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-h-0">
          {mode === "side-by-side" && (
            <div className="flex gap-4 h-full">
              <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center flex-shrink-0">
                  {selectedRevisions[0]}
                </h3>
                <div className="flex-1 min-h-0">
                  <canvas
                    ref={leftCanvasRef}
                    className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg"
                    style={{ display: "block" }}
                  />
                </div>
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 text-center flex-shrink-0">
                  {selectedRevisions[1]}
                </h3>
                <div className="flex-1 min-h-0">
                  <canvas
                    ref={rightCanvasRef}
                    className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg"
                    style={{ display: "block" }}
                  />
                </div>
              </div>
            </div>
          )}

          {(mode === "overlay" || mode === "slider") && (
            <div className="h-full flex flex-col">
              <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2 flex-shrink-0">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  ◀ {selectedRevisions[0]}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {selectedRevisions[1]} ▶
                </span>
              </div>
              <div className="flex-1 min-h-0 relative">
                <canvas
                  ref={overlayCanvasRef}
                  className={`w-full h-full bg-gray-50 border border-gray-200 rounded-lg ${
                    mode === "slider" ? "cursor-col-resize" : ""
                  }`}
                  style={{ display: "block", touchAction: "none" }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
