# Phase 3 - Step 05: 에러 모니터링 (Sentry)

## 목표
- Sentry를 통한 프로덕션 에러 모니터링

## 작업 항목
- [x] `@sentry/nextjs` 설치 및 설정
- [x] `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` 생성
- [x] `app/global-error.tsx` — 글로벌 에러 바운더리
- [x] Graceful degradation (Sentry 미설정 시 정상 동작)

## 완료 조건
- 프로덕션 에러가 Sentry 대시보드에 기록
- Sentry 미설정 시에도 앱 정상 동작

## 참고
- 커밋: `bb1a632`
- Agent Teams 5차 병렬 작업
- 마이그레이션 경고: instrumentation 파일로 이동 필요 (Turbopack 호환)
