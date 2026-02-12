/**
 * main.tsx
 * - 애플리케이션의 진입점 (Entry Point)
 * - React 앱을 HTML의 root 요소에 마운트
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// HTML의 #root 요소를 찾아서 React 앱을 렌더링
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
