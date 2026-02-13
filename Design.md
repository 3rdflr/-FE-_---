# DESIGN.md - 설계 문서

## 데이터 분석

### metadata.json 구조 해석

제공된 데이터는 **3차원 계층 구조**로 이루어져 있습니다:

```
공간(Space) × 공종(Discipline) × 시간(Revision)
```

**계층 구조:**

```
전체 배치도 (00)
├── 101동 (01)
│   ├── 건축 → REV0, REV1
│   ├── 구조 → Region A (REV1A, REV2A), Region B (REV1B, REV2B)
│   ├── 공조설비 → REV0
│   └── ...
├── 주민공동시설 (02)
│   └── 건축 → REV0, REV1, REV2, REV3 (각각 다른 polygon)
└── 주차장 (03)
```

### 데이터 패턴 분류

metadata.json의 불규칙한 구조를 3가지 패턴으로 정규화했습니다:

**1. Standard Pattern (표준 패턴)**
```typescript
{
  imageTransform: {...},
  polygon: [...],
  revisions: [REV0, REV1, ...]
}
```
- 대부분의 공종이 이 패턴을 따름
- 공종 레벨의 polygon과 imageTransform 보유
- 모든 리비전이 동일한 polygon 공유
- **예시**: 101동 건축, 공조설비, 배관설비 등

**2. Region Partitioned Pattern (영역 분할 패턴)**
```typescript
{
  imageTransform: {...},
  regions: {
    A: { polygon: [...], revisions: [REV1A, REV2A] },
    B: { polygon: [...], revisions: [REV1B, REV2B] }
  }
}
```
- 하나의 공종이 여러 영역으로 분할
- 각 영역이 독립적인 polygon과 리비전 이력 보유
- UI에서 Region 탭으로 전환
- **예시**: 101동 구조 (Region A, B)

**3. Independent Revision Pattern (독립 리비전 패턴)**
```typescript
{
  revisions: [
    { imageTransform: {...}, polygon: [...] },  // REV0
    { imageTransform: {...}, polygon: [...] }   // REV1
  ]
}
```
- 공종 레벨의 polygon 없음
- 각 리비전마다 독립적인 imageTransform과 polygon 보유
- 리비전 선택 시 해당 polygon 우선 적용
- **예시**: 주민공동시설 건축 (REV0~3 각각 다른 polygon)

**4. relativeTo 체인**

- 레이어 이미지가 기준 도면에 상대적으로 정렬
- 예: 공조설비 → 건축.png 기준
- 현재는 수동 드래그로 미세 조정 가능

### 더 나은 데이터 표현 방법

현재 구조의 개선점:

1. **정규화**: Drawing과 Revision을 별도 테이블로 분리하면 중복 감소
2. **버전 관리**: Git과 유사한 브랜치/머지 개념 도입 가능
3. **메타데이터 확장**: 작성자, 승인 상태 등 워크플로우 정보 추가

---

## 접근 방식

### 개발 순서

**1단계: 데이터 모델링**

- metadata.json 분석 및 TypeScript 인터페이스 정의
- 특수 케이스(Region, 리비전별 polygon) 식별

**2단계: 상태 설계**

- Zustand 스토어 구조 설계
- 현재 선택 상태(drawing, discipline, region, revision) 관리
- 레이어 상태(visible, opacity, offset) 관리

**3단계: 기본 UI 구축**

- 레이아웃 구성 (사이드바 + 캔버스)
- 공간 트리, 공종 선택기 구현

**4단계: Canvas 렌더링**

- 도면 이미지 로드 및 표시
- Viewport(줌/팬) 구현

**5단계: 고급 기능**

- 레이어 오버레이 시스템
- Hotspot 클릭
- 리비전 비교 모드
- 레이어 드래그 앤 드롭

---

## UI 설계 결정

### 레이아웃 선택: 2-Column (사이드바 + 캔버스)

```
┌────────────────────────────────────────┐
│ Header + Breadcrumb                    │
├──────────┬─────────────────────────────┤
│ Sidebar  │ Canvas                      │
│ (280px)  │ (flex-1)                    │
│          │                             │
│ - 공간   │        도면 영역            │
│ - 공종   │                             │
│ - 리비전 │                    [줌컨트롤]│
│ - 레이어 │                             │
│ - 정보   │              [레이어 안내]  │
└──────────┴─────────────────────────────┘
```

**선택 이유:**

- 도면 뷰어에서 캔버스 영역 최대화가 핵심
- 계층적 네비게이션을 수직 스크롤로 자연스럽게 표현
- CAD 소프트웨어의 일반적인 패턴과 유사

### 고려했던 대안들

**대안 1: 3-Column (좌측 트리 + 캔버스 + 우측 속성)**

- 장점: 정보 분리가 명확
- 단점: 캔버스 영역 축소, 모바일 대응 어려움
- 결정: 단일 사이드바로 통합

**대안 2: 탭 기반 네비게이션**

- 장점: 공간 효율적
- 단점: 현재 위치 파악이 어려움, 컨텍스트 전환 비용
- 결정: 스크롤 가능한 단일 패널 선택

**대안 3: 모달 기반 선택**

- 장점: 깔끔한 메인 화면
- 단점: 빠른 전환이 어려움
- 결정: 리비전 비교만 모달로 구현

### 레이어 시스템 설계

**요구사항 분석:**

- 여러 공종을 겹쳐서 간섭 확인 필요
- 투명도 조절로 가시성 제어
- 개별 레이어 위치 조정 필요 (Figma 스타일)

**구현 결정:**

1. 체크박스로 레이어 on/off
2. 슬라이더로 투명도 조절 (0-100%)
3. Shift + 드래그로 레이어 위치 이동
4. "정렬" 버튼으로 원위치 복귀
5. 잠금 기능으로 실수 방지

---

## 기술 선택

### 핵심 라이브러리 선정

| 기술 | 선택 이유 (Why?) |
|-----|----------------|
| **React 18** | 컴포넌트 기반 아키텍처로 복잡한 UI를 모듈화하여 관리. Concurrent Features로 렌더링 성능 최적화 |
| **TypeScript** | metadata.json의 복잡한 계층 구조(3가지 패턴)를 타입 시스템으로 안전하게 관리. 런타임 에러 사전 방지 |
| **Vite** | 빠른 HMR과 개발 서버로 생산성 향상. esbuild 기반으로 빌드 속도 우수 |
| **Tailwind CSS** | 유틸리티 우선 방식으로 빠른 프로토타이핑. 일관된 디자인 시스템. PurgeCSS로 번들 최적화 |
| **Zustand** | Redux보다 가볍고 보일러플레이트가 적음. TypeScript 친화적. 선택적 구독으로 성능 최적화 |
| **Canvas API** | 대용량 도면 이미지 처리에 최적. 복잡한 transform 연산 처리. 줌/팬 구현 용이 |

### 라이브러리 미선택 이유

| 라이브러리 | 검토 결과 | 미선택 이유 |
|-----------|---------|-----------|
| **react-router-dom** | 검토함 | 단일 페이지 앱으로 충분. URL 라우팅의 복잡성 대비 이득 적음. Zustand 상태만으로 뷰 관리 가능 |
| **react-konva** | 검토함 | 추가 추상화 레이어 불필요. 순수 Canvas API로 더 세밀한 제어 가능. 번들 크기 증가 방지 |
| **framer-motion** | 검토함 | 과제 범위에서 복잡한 애니메이션 불필요. CSS transition으로 충분. 번들 크기 고려 |
| **Redux** | 검토함 | 보일러플레이트 과다. Zustand로 동일한 기능을 더 간결하게 구현 가능 |

### URL 라우팅 미적용 이유

**검토 내용:**
- 다른 프로젝트: `/building/:drawingId/:discipline` 형태로 URL 기반 상태 관리
- 장점: 새로고침/링크 공유 시 상태 유지

**미적용 결정:**
1. **단일 사용자 세션**: 도면 뷰어는 동시에 여러 도면을 탭으로 열지 않음. 링크 공유 요구사항 없음
2. **상태 복잡도**: Discipline뿐만 아니라 Region, Revision, Layer Offsets까지 관리. URL에 모두 인코딩하면 과도하게 복잡
3. **Zustand 충분**: 전역 상태로 뷰 관리가 직관적이고 간단함
4. **브라우저 히스토리**: 뒤로가기 동작이 도면 뷰어에서 직관적이지 않을 수 있음 (사이드바 선택이 더 자연스러움)

**개선 여지**: 향후 다중 사용자 협업 기능 추가 시 URL 라우팅 도입 검토

### 상태 관리: Zustand

**선택 기준:**

- 보일러플레이트 최소화
- TypeScript 친화적
- 선택적 구독으로 불필요한 리렌더링 방지

**비교:**
| 라이브러리 | 장점 | 단점 | 결정 |
|-----------|------|------|------|
| Context API | 내장, 간단 | 리렌더링 이슈, 중첩 Provider | ❌ |
| Redux | 강력한 DevTools | 보일러플레이트 과다 | ❌ |
| Zustand | 간결, TypeScript 지원 | 상대적으로 적은 생태계 | ✅ |

### 스타일링: Tailwind CSS

**선택 기준:**

- 빠른 프로토타이핑
- 일관된 디자인 시스템
- 번들 크기 최적화 (PurgeCSS)

**비교:**
| 방식 | 장점 | 단점 | 결정 |
|------|------|------|------|
| CSS Modules | 스코프 격리 | 파일 분리, 클래스명 관리 | ❌ |
| Styled Components | CSS-in-JS | 런타임 비용 | ❌ |
| Tailwind CSS | 유틸리티 우선, 빠른 개발 | 클래스 길어짐 | ✅ |

### 렌더링: Canvas API

**선택 기준:**

- 대용량 이미지 처리
- 자유로운 Transform 적용
- 줌/팬 구현 용이

**대안 (미선택):**

- SVG: DOM 조작 비용, 대용량 이미지에 부적합
- WebGL: 과도한 복잡성

---

## 어려웠던 점 및 개선 방안

### 1. 레이어 오버레이 위치 정렬

**문제:**

- 각 공종 도면의 크기와 기준점이 다름
- 단순히 중앙에 겹치면 위치가 맞지 않음

**해결:**

- 모든 레이어를 동일한 중앙점 기준으로 렌더링
- 개별 오프셋(offsetX, offsetY)으로 미세 조정 가능
- Figma 스타일 드래그로 사용자가 직접 정렬

**개선 방안:**

- imageTransform의 relativeTo 체인을 완전히 해석하여 자동 정렬
- 현재는 수동 드래그로 보완

### 2. Hotspot 클릭 좌표 계산

**문제:**

- Viewport(줌/팬) 적용 후 마우스 좌표 → 이미지 좌표 변환 필요
- DPR(Device Pixel Ratio) 고려 필요

**해결:**

```typescript
// 마우스 좌표를 이미지 좌표로 변환
const realX = (canvasX - viewportOffsetX) / viewportZoom;
const realY = (canvasY - viewportOffsetY) / viewportZoom;
const imgX = (realX - imageX) / imageScale;
const imgY = (realY - imageY) / imageScale;
```

### 3. Shift + 드래그 이벤트 처리

**문제:**

- useCallback 의존성 배열에서 layers 참조 문제
- 캔버스 밖으로 드래그 시 이벤트 누락

**해결:**

- isDraggingLayer를 useState로 관리하여 리렌더링 트리거
- mousemove/mouseup을 window에 등록

### 4. 리비전 비교 모달 스케일

**문제:**

- 모달 내 캔버스가 과도하게 확대됨
- DPR 적용 후 좌표계 불일치

**해결:**

- 별도의 setupCanvas 함수로 DPR 처리
- 렌더링 전 setTimeout으로 DOM 준비 대기

### 5. 리비전 비교 시 이미지 scale 불일치 🆕

**문제:**

- Region A의 REV1A와 REV2A가 같은 물리적 영역을 나타내지만, 이미지 파일의 해상도(픽셀 크기)가 다른 경우 발생
- 예: REV1A는 1000×800px, REV2A는 2000×1600px (같은 영역을 더 높은 해상도로 스캔)
- 기존 코드에서는 각 이미지의 원본 크기(`img.width * scale`)로 렌더링하여 화면에서 REV2A가 2배 크게 표시됨
- **실제로는 같은 영역이므로 동일한 크기로 비교**되어야 함

**해결:**

```typescript
// 두 이미지 중 큰 이미지를 기준으로 공통 렌더링 크기 계산
const maxWidth = Math.max(img1.width, img2.width);
const maxHeight = Math.max(img1.height, img2.height);
const scale = Math.min(
  (width * 0.85) / maxWidth,
  (height * 0.85) / maxHeight,
);

// 동일한 렌더링 크기 적용 (원본 크기가 달라도 화면에서 같은 크기로)
const renderWidth = maxWidth * scale;
const renderHeight = maxHeight * scale;

// 두 이미지 모두 renderWidth × renderHeight 영역에 맞춰 그리기
ctx.drawImage(img1, x, y, renderWidth, renderHeight);
ctx.drawImage(img2, x, y, renderWidth, renderHeight);
```

**적용 범위:**
- Overlay 모드: `prerenderImages()` 함수
- Slider 모드: `prerenderImages()` 함수
- Side-by-side 모드: `renderSideBySide()` 함수

**결과:**
- 원본 이미지 해상도가 달라도 화면에서 정확히 같은 배율로 비교 가능
- 물리적으로 동일한 영역을 나타내는 리비전들의 정확한 비교 가능

### 시간이 더 주어진다면

**단기 개선 (1주):**

1. imageTransform relativeTo 체인 완전 구현
2. 반응형 디자인 (모바일)
3. 키보드 단축키 (화살표 이동, +/- 줌)

**중기 개선 (1개월):** 4. 도면 검색 기능 5. 북마크/즐겨찾기 6. 다크 모드 7. 도면 인쇄/내보내기

**장기 개선:** 8. 주석/마크업 기능 9. 실시간 협업 (WebSocket) 10. WebGL 렌더링으로 성능 최적화

---

---

## 변경 이력

| 날짜 | 내용 |
|-----|-----|
| 2025-02-12 | 초기 문서 작성, 데이터 구조 분석, 기본 기술 스택 결정 |
| 2025-02-13 | 데이터 패턴 3가지 분류 추가, 핵심 라이브러리 선정 이유 표 추가, URL 라우팅 미적용 근거 작성 |
| 2025-02-13 | 리비전 비교 시 이미지 scale 불일치 문제 해결 과정 추가 |
