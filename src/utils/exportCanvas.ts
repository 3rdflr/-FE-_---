/**
 * 캔버스를 이미지로 내보내거나 인쇄하는 유틸리티
 */

/**
 * 캔버스를 PNG 이미지로 다운로드
 * @param canvas - 내보낼 캔버스 엘리먼트
 * @param filename - 저장할 파일명
 */
export const exportCanvasAsImage = (canvas: HTMLCanvasElement, filename: string = "drawing.png") => {
  // 캔버스를 Blob으로 변환
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error("Failed to create blob from canvas");
      return;
    }

    // Blob URL 생성
    const url = URL.createObjectURL(blob);

    // 다운로드 링크 생성 및 클릭
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // 정리
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, "image/png");
};

/**
 * 캔버스를 인쇄
 * @param canvas - 인쇄할 캔버스 엘리먼트
 * @param title - 인쇄 문서 제목
 */
export const printCanvas = (canvas: HTMLCanvasElement, title: string = "도면") => {
  // 새 창 열기
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
    return;
  }

  // 캔버스를 이미지로 변환
  const dataUrl = canvas.toDataURL("image/png");

  // HTML 작성
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          img {
            max-width: 100%;
            height: auto;
          }
          @media print {
            body {
              padding: 0;
            }
            img {
              max-width: 100%;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${title}" onload="window.print(); window.close();" />
      </body>
    </html>
  `);

  printWindow.document.close();
};

/**
 * 캔버스의 현재 상태를 복사하여 새 캔버스 생성
 * (주석 포함한 최종 이미지)
 * @param sourceCanvas - 원본 캔버스
 * @returns 복사된 캔버스
 */
export const cloneCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
  const clone = document.createElement("canvas");
  clone.width = sourceCanvas.width;
  clone.height = sourceCanvas.height;

  const ctx = clone.getContext("2d");
  if (ctx) {
    ctx.drawImage(sourceCanvas, 0, 0);
  }

  return clone;
};
