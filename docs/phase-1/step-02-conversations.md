# Phase 1 - Step 02: 대화 저장/관리

## 목표
- 대화 세션 CRUD 및 사이드바 UI 구현

## 작업 항목
- [x] DB 테이블: `conversations` (대화 세션) + `messages` (메시지) + RLS 정책
- [x] API 라우트: GET/POST/DELETE `/api/conversations`, GET/POST `/api/conversations/[id]/messages`
- [x] `components/sidebar.tsx`: 대화 목록, 새 대화, 삭제, 모바일 토글
- [x] `app/page.tsx`: 사이드바 + 채팅 레이아웃 재구성
- [x] `components/chat.tsx`: 대화 저장/로드 연동
  - `key={conversationId}`로 리마운트, `onSubmit`에서 사용자 메시지 저장, `onFinish`에서 응답 저장
  - 첫 메시지 시 대화 자동 생성 (제목 = 첫 메시지 30자)

## 완료 조건
- 대화 생성/저장/로드/삭제 정상 동작
- 사이드바에서 대화 전환 가능

## 참고
- 커밋: `2588cbd`
- Supabase SQL Editor에서 테이블 직접 생성 필요
- 인덱스: `idx_conversations_user`, `idx_messages_conversation`
