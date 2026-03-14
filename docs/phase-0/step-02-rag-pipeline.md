# Phase 0 - Step 02: RAG 파이프라인 구현

## 목표
- 문서 수집(청킹 + 임베딩) 및 RAG 쿼리 파이프라인 구축

## 작업 항목
- [x] 문서 청킹 유틸 (`lib/chunker.ts` — 500자, 100자 오버랩)
- [x] 임베딩 생성 함수 (`lib/ai/embedding.ts` — text-embedding-3-small)
- [x] 문서 수집 API (`/api/ingest` — 파일 업로드 → 청킹 → 임베딩 → Supabase)
- [x] RAG 쿼리 API (`/api/chat` — 질문 임베딩 → 유사도 검색 → GPT-4o 스트리밍)
- [x] 유사도 임계값 조정 (0.5 → 0.2), 임베딩에 `[출처: 파일명]` 포함

## 완료 조건
- 텍스트 파일 → 청킹 → 임베딩 → Supabase 저장 파이프라인 동작
- 질문 → 유사 문서 검색 → GPT-4o 스트리밍 응답

## 참고
- 커밋: `bfcfa9f` (Supabase setup, RAG pipeline)
- 핵심 파일: `lib/chunker.ts`, `lib/ai/embedding.ts`, `app/api/chat/route.ts`, `app/api/ingest/route.ts`
