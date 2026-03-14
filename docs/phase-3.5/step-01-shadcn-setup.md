# Phase 3.5 - Step 01: shadcn/ui 설치 및 Chat 모듈 분리

## 목표
- shadcn/ui 디자인 시스템 도입 및 Chat 컴포넌트 모듈화

## 작업 항목
- [x] shadcn/ui 초기화 (new-york 스타일, neutral 색상, HSL CSS variables)
- [x] `lib/utils.ts` — cn() 유틸리티 (clsx + tailwind-merge)
- [x] shadcn/ui 컴포넌트 14개 설치:
  - Avatar, Badge, Button, Card, Dialog, DropdownMenu, Input, Label, ScrollArea, Sheet, Skeleton, Textarea, Toast, Toaster
- [x] 의존성 추가: Radix UI 7개 + class-variance-authority, clsx, tailwind-merge, tailwindcss-animate, lucide-react
- [x] `components/chat.tsx` (모놀리식) → 5개 모듈 분리:
  - `chat-container.tsx` — useChat 훅, 대화 생성/저장 로직
  - `message-list.tsx` — 메시지 목록, 스크롤, 에러 표시
  - `message-bubble.tsx` — 메시지 버블, 마크다운 렌더링
  - `chat-input.tsx` — 입력창, 파일 업로드
  - `source-panel.tsx` — RAG 출처 패널
- [x] `components/chat.tsx` → re-export 배럴 (기존 import 호환)
- [x] `hooks/use-toast.ts` — 토스트 상태 관리

## 완료 조건
- 14개 shadcn/ui 컴포넌트 설치 완료
- Chat 5개 모듈 분리, 빌드 성공, 기존 기능 정상 동작

## 참고
- 커밋: `6a61752`
- 날짜: 2026-02-18~19
- 25 files changed, +3359/-528
