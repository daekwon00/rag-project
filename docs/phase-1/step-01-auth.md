# Phase 1 - Step 01: 사용자 인증 (Supabase Auth)

## 목표
- 이메일/비밀번호 기반 사용자 인증 시스템 구축

## 작업 항목
- [x] `@supabase/ssr` 패키지 설치
- [x] 이중 Supabase 클라이언트 아키텍처 구성
  - `lib/db/index.ts`: 서비스 역할 키 → RAG 파이프라인 전용
  - `lib/supabase/server.ts`: @supabase/ssr createServerClient → 서버 인증
  - `lib/supabase/client.ts`: @supabase/ssr createBrowserClient → 클라이언트 인증
- [x] `middleware.ts`: 세션 리프레시 + 미인증 → `/login` 리다이렉트
- [x] `/login`, `/signup` 페이지: 이메일/비밀번호 폼
- [x] `/auth/callback`: 이메일 확인 콜백 라우트
- [x] 기존 API (`/api/chat`, `/api/ingest`)에 인증 체크 추가

## 완료 조건
- 미인증 사용자 → /login 리다이렉트
- 로그인/회원가입 → 이메일 확인 → 세션 생성
- API 요청 시 인증 검증

## 참고
- 커밋: `2588cbd`
- 날짜: 2026-02-14
- 핵심 설계: 서비스 역할 키(RAG) + anon key(인증) 분리 → RLS 보안 유지
