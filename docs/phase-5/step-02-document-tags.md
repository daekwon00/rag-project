# Phase 5 - Step 02: 문서 태그/카테고리 관리

## 목표
- 업로드된 문서에 태그/카테고리를 부여하고 필터링할 수 있도록 개선

## 작업 항목
- [ ] DB 스키마 확장 (resources 테이블에 tags 컬럼 또는 별도 테이블)
- [ ] 문서 업로드 시 태그 입력 UI
- [ ] Documents 페이지에 태그 필터링 기능
- [ ] RAG 검색 시 태그 기반 필터링 옵션
- [ ] 태그 관리 UI (생성/삭제)

## 완료 조건
- 문서에 태그를 부여/제거 가능
- 태그로 문서 필터링 가능

## 참고
- `app/documents/page.tsx` — 문서 관리 UI
- `lib/db/schema.ts` — DB 스키마
- Supabase SQL 실행 필요할 수 있음
