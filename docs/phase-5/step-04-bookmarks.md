# Phase 5 - Step 04: 북마크/즐겨찾기

## 목표
- 중요한 대화나 메시지를 북마크하여 빠르게 접근

## 작업 항목
- [ ] 대화 즐겨찾기 토글 (사이드바)
- [ ] DB 스키마: conversations 테이블에 is_bookmarked 컬럼
- [ ] 즐겨찾기 대화 상단 고정 표시
- [ ] 즐겨찾기 필터링

## 완료 조건
- 대화를 즐겨찾기로 표시/해제 가능
- 즐겨찾기된 대화가 목록 상단에 표시

## 참고
- `components/sidebar.tsx` — 대화 목록 UI
- `app/api/conversations/route.ts` — 대화 API
