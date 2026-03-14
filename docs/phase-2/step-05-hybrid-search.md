# Phase 2 - Step 05: Hybrid Search (벡터 + BM25 RRF)

## 목표
- 벡터 검색 + BM25 텍스트 검색을 RRF로 결합하여 검색 정확도 향상

## 작업 항목
- [x] `lib/search/bm25.ts` 신규: BM25 텍스트 스코어링 (순수 TypeScript)
- [x] `lib/db/index.ts`에 텍스트 검색용 메서드 추가 (ILIKE)
- [x] `lib/ai/embedding.ts`의 `findRelevantContent` 확장:
  - 벡터 검색 + BM25 검색 → RRF(Reciprocal Rank Fusion) 결합
  - 기존 함수 시그니처 유지 (하위호환)
- [x] 테스트: 17개 BM25 테스트 추가

## 완료 조건
- 키워드 매칭 + 의미 검색이 결합된 하이브리드 검색 동작
- 전체 테스트 통과

## 참고
- 커밋: `154e05b`
- Agent Teams 4차 (search-engineer)
- tsconfig `target: es2017` 설정 (유니코드 정규식, Set 이터레이션)
