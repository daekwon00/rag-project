# Phase 6 - Step 03: 번들 사이즈 분석 및 최적화

## 목표
- 번들 사이즈를 분석하고 불필요한 의존성을 제거하여 로딩 속도 개선

## 작업 항목
- [ ] @next/bundle-analyzer 설치 및 분석
- [ ] 대형 의존성 식별 (tree-shaking 확인)
- [ ] 동적 import 적용 (무거운 컴포넌트)
- [ ] 이미지/폰트 최적화
- [ ] 분석 결과 기록

## 완료 조건
- 번들 분석 리포트 생성
- 불필요한 대형 의존성 제거 또는 최적화

## 참고
- shadcn/ui는 tree-shakable (개별 import)
- pdf-parse, mammoth, officeparser 등은 서버 전용
