# Phase 2 - Step 02: 문서 관리 대시보드

## 목표
- 업로드된 문서 목록 조회 및 삭제 기능

## 작업 항목
- [x] `/documents` 페이지 생성 (`app/documents/page.tsx`)
- [x] 문서 CRUD API (`/api/documents` — GET/DELETE)
- [x] 문서 목록 표시 (파일명, 업로드일, 청크 수)
- [x] 문서 삭제 기능 (관련 embeddings 연쇄 삭제)
- [x] Rate Limiting 적용 (DELETE 분당 10회)

## 완료 조건
- `/documents`에서 업로드 문서 목록 확인 가능
- 문서 삭제 시 관련 임베딩도 삭제

## 참고
- 커밋: `e92345f`
- Agent Teams 2차 (doc-dashboard)
