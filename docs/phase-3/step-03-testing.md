# Phase 3 - Step 03: 테스트 코드

## 목표
- Vitest 설정 + 핵심 유틸리티 단위 테스트

## 작업 항목
- [x] Vitest + @vitejs/plugin-react + jsdom 설치
- [x] `vitest.config.ts` 생성 (Next.js 호환, path alias)
- [x] `package.json`에 `"test": "vitest run"` 스크립트
- [x] 테스트 작성:
  - `__tests__/lib/chunker.test.ts` — 청커 테스트 (23개)
  - `__tests__/lib/search/bm25.test.ts` — BM25 스코어링 (17개)
  - `__tests__/lib/ai/embedding.test.ts` — 임베딩 테스트 (8개)
  - `__tests__/api/chat.test.ts` — 채팅 API 테스트 (6개)
- [x] 외부 의존성 모킹 (OpenAI, Supabase)

## 완료 조건
- `npm run test` — 74개 테스트 전체 통과

## 참고
- 커밋: `46e0f54` (초기 25개), 이후 확장하여 74개
- Agent Teams 3차 (test-setup)
