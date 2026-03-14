# Phase 3 - Step 04: CI/CD 파이프라인

## 목표
- GitHub Actions로 자동 빌드/테스트 파이프라인 구성

## 작업 항목
- [x] `.github/workflows/ci.yml` 생성
- [x] 트리거: push to main, PR to main
- [x] 단계: checkout → Node.js 20.x setup → npm ci → tsc --noEmit → vitest run
- [x] 환경변수: 테스트에서 mock이므로 불필요

## 완료 조건
- push/PR 시 자동으로 타입 체크 + 테스트 실행
- CI 통과 확인

## 참고
- 커밋: `154e05b`
- Agent Teams 4차 (ci-engineer)
