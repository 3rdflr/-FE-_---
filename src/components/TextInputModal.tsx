import React, { useState, useEffect, useRef } from "react";

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  position: { x: number; y: number };
}

export const TextInputModal: React.FC<TextInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  position,
}) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setText("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText("");
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 입력 모달 */}
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border-2 border-blue-500
                   left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          minWidth: "300px",
          maxWidth: "400px",
        }}
      >
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              메모 입력
            </label>
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       resize-none"
              rows={3}
              placeholder="메모를 입력하세요..."
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Ctrl+Enter로 저장, Esc로 취소
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         rounded transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600
                         disabled:bg-gray-300 dark:disabled:bg-gray-600
                         disabled:cursor-not-allowed rounded transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
