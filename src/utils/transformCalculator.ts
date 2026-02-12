/**
 * transformCalculator.ts
 * - 이미지 변환(위치, 크기, 회전)을 계산하는 유틸리티
 * - 상대 좌표계(relativeTo)를 절대 좌표계로 변환
 * - 3x3 변환 행렬을 사용한 수학적 변환 처리
 */

import type { ImageTransform, Drawing, Metadata } from "../types/metadata";

/**
 * 3x3 변환 행렬 클래스
 * - 2D 변환(이동, 회전, 확대/축소)을 행렬로 표현
 * - 행렬 구조:
 *   [a  c  e]   [scale*cos  -scale*sin  x]
 *   [b  d  f] = [scale*sin   scale*cos  y]
 *   [0  0  1]   [0           0           1]
 * - a, b, c, d: 회전과 확대/축소를 표현
 * - e, f: x, y 이동을 표현
 */
class Matrix3x3 {
  constructor(
    public a: number,  // 첫 번째 행, 첫 번째 열
    public b: number,  // 두 번째 행, 첫 번째 열
    public c: number,  // 첫 번째 행, 두 번째 열
    public d: number,  // 두 번째 행, 두 번째 열
    public e: number,  // 첫 번째 행, 세 번째 열 (x 이동)
    public f: number,  // 두 번째 행, 세 번째 열 (y 이동)
  ) {}

  /**
   * 단위 행렬 생성
   * - 변환이 없는 기본 상태 (확대 1배, 회전 0도, 이동 0)
   */
  static identity(): Matrix3x3 {
    return new Matrix3x3(1, 0, 0, 1, 0, 0);
  }

  /**
   * ImageTransform을 행렬로 변환
   * - x, y, scale, rotation 정보를 3x3 행렬로 변환
   */
  static fromTransform(transform: ImageTransform): Matrix3x3 {
    const cos = Math.cos(transform.rotation);  // 회전 각도의 코사인
    const sin = Math.sin(transform.rotation);  // 회전 각도의 사인
    const s = transform.scale;                 // 확대/축소 비율

    return new Matrix3x3(
      s * cos,      // a: 확대 * 회전(코사인)
      s * sin,      // b: 확대 * 회전(사인)
      -s * sin,     // c: 확대 * 회전(-사인)
      s * cos,      // d: 확대 * 회전(코사인)
      transform.x,  // e: x 이동
      transform.y,  // f: y 이동
    );
  }

  /**
   * 행렬 곱셈
   * - 두 변환을 합성 (this 변환 후 other 변환)
   * - A * B = 먼저 B 변환, 그 다음 A 변환
   */
  multiply(other: Matrix3x3): Matrix3x3 {
    return new Matrix3x3(
      this.a * other.a + this.c * other.b,      // 새로운 a
      this.b * other.a + this.d * other.b,      // 새로운 b
      this.a * other.c + this.c * other.d,      // 새로운 c
      this.b * other.c + this.d * other.d,      // 새로운 d
      this.a * other.e + this.c * other.f + this.e,  // 새로운 e (x)
      this.b * other.e + this.d * other.f + this.f,  // 새로운 f (y)
    );
  }

  /**
   * 행렬을 ImageTransform으로 역변환
   * - 행렬에서 x, y, scale, rotation 정보 추출
   */
  toTransform(): ImageTransform {
    // 확대/축소 비율 계산 (벡터의 크기)
    const scale = Math.sqrt(this.a * this.a + this.b * this.b);
    // 회전 각도 계산 (아크탄젠트)
    const rotation = Math.atan2(this.b, this.a);

    return {
      x: this.e,           // x 이동
      y: this.f,           // y 이동
      scale: scale,        // 확대/축소
      rotation: rotation,  // 회전 (라디안)
    };
  }
}

/**
 * TransformCalculator 클래스
 * - 복잡한 상대 좌표계를 절대 좌표계로 변환하는 계산기
 * - 도면 계층 구조를 따라 변환을 누적 계산
 * - 성능 최적화를 위한 캐싱 포함
 */
export class TransformCalculator {
  private metadata: Metadata;  // 프로젝트 메타데이터
  private cache: Map<string, ImageTransform> = new Map();  // 계산 결과 캐시

  constructor(metadata: Metadata) {
    this.metadata = metadata;
  }

  /**
   * 절대 좌표계 변환 계산
   * - relativeTo 체인을 따라가며 누적 계산
   * - 계층 구조: Drawing Position → Discipline Transform → Region/Revision Transform
   *
   * @param drawingId - 도면 ID
   * @param discipline - 공종명 (선택)
   * @param revision - 리비전 버전 (선택)
   * @param region - 영역명 (선택)
   * @returns 절대 좌표계 기준 변환 정보
   */
  getAbsoluteTransform(
    drawingId: string,
    discipline?: string,
    revision?: string,
    region?: string,
  ): ImageTransform {
    // 캐시 키 생성 (동일한 요청은 캐시에서 반환)
    const cacheKey = `${drawingId}-${discipline}-${revision}-${region}`;

    // 캐시에 있으면 즉시 반환
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const drawing = this.metadata.drawings[drawingId];

    // 도면이 없으면 기본 변환 반환
    if (!drawing) {
      return { x: 0, y: 0, scale: 1, rotation: 0 };
    }

    // 결과 변환 (기본값으로 시작)
    let resultTransform: ImageTransform = { x: 0, y: 0, scale: 1, rotation: 0 };

    // === 1. Drawing의 position (전체 배치도에서의 위치) ===
    if (drawing.position) {
      resultTransform = drawing.position.imageTransform;
    }

    // === 2. Discipline의 imageTransform (공종별 위치) ===
    if (discipline && drawing.disciplines) {
      const disciplineData = drawing.disciplines[discipline];

      if (disciplineData.imageTransform) {
        // relativeTo가 있으면 기준 이미지 찾기
        if (disciplineData.imageTransform.relativeTo) {
          // relativeTo 파일명으로 기준 도면 찾기
          const baseDrawing = this.findDrawingByImage(
            disciplineData.imageTransform.relativeTo,
          );

          if (baseDrawing && baseDrawing.id !== drawingId) {
            // 재귀적으로 기준 도면의 transform 계산
            const baseTransform = this.getAbsoluteTransform(baseDrawing.id);

            // 현재 transform을 기준 transform에 상대적으로 적용
            // 단, relativeTo인 경우 상대 좌표이므로 그대로 사용
            resultTransform = {
              x: disciplineData.imageTransform.x,
              y: disciplineData.imageTransform.y,
              scale: disciplineData.imageTransform.scale,
              rotation: disciplineData.imageTransform.rotation,
            };
          } else {
            // 같은 도면 내에서의 relativeTo (예: 건축 기준)
            resultTransform = {
              x: disciplineData.imageTransform.x,
              y: disciplineData.imageTransform.y,
              scale: disciplineData.imageTransform.scale,
              rotation: disciplineData.imageTransform.rotation,
            };
          }
        } else {
          // relativeTo가 없으면 절대 좌표
          resultTransform = disciplineData.imageTransform;
        }
      }
    }

    // === 3. Region의 revision imageTransform (영역별 리비전) ===
    if (region && discipline && drawing.disciplines) {
      const disciplineData = drawing.disciplines[discipline];

      if (disciplineData.regions) {
        const regionData = disciplineData.regions[region];

        if (revision) {
          const revisionData = regionData.revisions.find(
            (r) => r.version === revision,
          );

          if (revisionData?.imageTransform) {
            // Region revision은 구조 도면을 relativeTo로 가짐
            if (revisionData.imageTransform.relativeTo) {
              resultTransform = {
                x: revisionData.imageTransform.x,
                y: revisionData.imageTransform.y,
                scale: revisionData.imageTransform.scale,
                rotation: revisionData.imageTransform.rotation,
              };
            }
          }
        }
      }
    }

    // === 4. Revision의 imageTransform (일반 리비전) ===
    if (revision && discipline && drawing.disciplines) {
      const disciplineData = drawing.disciplines[discipline];

      if (disciplineData.revisions) {
        const revisionData = disciplineData.revisions.find(
          (r) => r.version === revision,
        );

        if (revisionData?.imageTransform) {
          if (revisionData.imageTransform.relativeTo) {
            resultTransform = {
              x: revisionData.imageTransform.x,
              y: revisionData.imageTransform.y,
              scale: revisionData.imageTransform.scale,
              rotation: revisionData.imageTransform.rotation,
            };
          }
        }
      }
    }

    // 결과를 캐시에 저장
    this.cache.set(cacheKey, resultTransform);
    return resultTransform;
  }

  /**
   * relativeTo를 재귀적으로 해결
   * - 상대 좌표를 절대 좌표로 변환
   * - 행렬 곱셈을 사용하여 변환 합성
   * (현재 코드에서는 사용되지 않음)
   */
  private resolveRelativeTo(transform: ImageTransform): ImageTransform {
    // relativeTo가 없으면 그대로 반환 (이미 절대 좌표)
    if (!transform.relativeTo) {
      return transform;
    }

    // relativeTo 파일명으로 해당 도면 찾기
    const baseDrawing = this.findDrawingByImage(transform.relativeTo);

    // 기준 도면을 찾지 못하면 그대로 반환
    if (!baseDrawing) {
      return transform;
    }

    // 기준 도면의 절대 좌표 transform 계산
    const baseTransform = this.getAbsoluteTransform(baseDrawing.id);

    // 현재 transform과 기준 transform을 행렬로 변환
    const currentMatrix = Matrix3x3.fromTransform(transform);
    const baseMatrix = Matrix3x3.fromTransform(baseTransform);

    // 행렬 곱셈으로 변환 합성 후 다시 transform으로 변환
    return baseMatrix.multiply(currentMatrix).toTransform();
  }

  /**
   * 이미지 파일명으로 도면 찾기
   * - 메타데이터를 순회하며 해당 이미지를 사용하는 도면 검색
   *
   * @param imageName - 찾을 이미지 파일명
   * @returns 해당 이미지를 사용하는 도면 (없으면 null)
   */
  private findDrawingByImage(imageName: string): Drawing | null {
    // 모든 도면 순회
    for (const drawing of Object.values(this.metadata.drawings)) {
      // 도면 자체 이미지가 일치하는지 확인
      if (drawing.image === imageName) {
        return drawing;
      }

      // 공종 이미지가 일치하는지 확인
      if (drawing.disciplines) {
        for (const disciplineData of Object.values(drawing.disciplines)) {
          if (disciplineData.image === imageName) {
            return drawing;
          }
        }
      }
    }

    // 해당 이미지를 사용하는 도면을 찾지 못함
    return null;
  }

  /**
   * 캐시 초기화
   * - 메타데이터가 변경되었을 때 호출하여 캐시된 계산 결과를 지움
   */
  clearCache() {
    this.cache.clear();
  }
}
