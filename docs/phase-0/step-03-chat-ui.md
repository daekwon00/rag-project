# Phase 0 - Step 03: 채팅 UI 및 배포

## 목표
- Vercel AI SDK useChat 기반 채팅 UI 구현 및 Vercel 프로덕션 배포

## 작업 항목
- [x] `components/chat.tsx` — useChat 훅, 파일 업로드, 에러 처리, 자동 스크롤
- [x] PDF 업로드 지원 (pdf-parse, `lib/pdf-parse.d.ts` 타입 선언)
- [x] 에러 핸들링 — alert → 인라인 상태 배너 (로딩/성공/에러)
- [x] UI 개선 — UDKsoft 브랜딩 헤더/푸터, 기술 배지, 커스텀 스크롤바
- [x] 샘플 데이터 5개 문서 (Next.js, RAG, TypeScript, Supabase, AI SDK)
- [x] Vercel 배포 + GitHub 연동 자동 배포
- [x] README 포트폴리오용 재작성

## 완료 조건
- PDF 업로드 가능, 에러 처리 완료
- https://rag-project-navy.vercel.app 프로덕션 배포 완료
- `git push origin main` → Vercel 자동 배포

## 참고
- 커밋: `8320e1e` (pdf-parse type), `3e4bc26` (UDKsoft branding)
- 빌드 에러 수정: `lib/pdf-parse.d.ts` 타입 선언 추가
