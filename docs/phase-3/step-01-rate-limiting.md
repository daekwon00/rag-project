# Phase 3 - Step 01: Rate Limiting

## 목표
- Upstash Redis 기반 API 속도 제한

## 작업 항목
- [x] `@upstash/ratelimit`, `@upstash/redis` 설치
- [x] `lib/rate-limit.ts` 생성:
  - `/api/chat`: 분당 20회 (Sliding Window)
  - `/api/ingest`: 분당 5회 (Fixed Window)
  - `/api/documents` DELETE: 분당 10회
  - 키: 인증된 user.id (비인증은 IP fallback)
- [x] 3개 API 라우트에 rate limit 체크 적용
- [x] 429 응답 + `Retry-After` 헤더
- [x] Graceful degradation: Upstash 미설정 시 경고 로그 후 통과

## 완료 조건
- Rate limit 초과 시 429 응답
- Upstash 미설정 시에도 앱 정상 동작

## 참고
- 커밋: `46e0f54`
- Agent Teams 3차 (rate-limiter)
- 환경변수: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
