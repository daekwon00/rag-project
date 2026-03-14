# Phase 4 - Step 01: Login/Signup 페이지 semantic 마이그레이션

## 목표
- Login/Signup 페이지의 하드코딩된 Tailwind 색상을 shadcn/ui semantic 토큰으로 전환

## 작업 항목
- [x] `app/login/page.tsx` 하드코딩 색상 → semantic 토큰 전환
- [x] `app/signup/page.tsx` 하드코딩 색상 → semantic 토큰 전환
- [x] shadcn/ui 컴포넌트 적용 (Button, Card, Input, Label)
- [x] 다크모드 정상 동작 확인
- [x] 에러/성공 메시지 스타일 통일

## 완료 조건
- Login/Signup 페이지에서 하드코딩된 gray-*, blue-*, red-* 등이 없을 것
- 라이트/다크 모드 모두 정상 표시
- 기존 기능(인증 흐름) 정상 동작

## 참고
- 커밋: (Phase 4 Step 01 완료)
- 변경: `<input>` → `<Input>`, `<button>` → `<Button>`, `<label>` → `<Label>`, 폼 → `<Card>`
- 색상: `text-red-600` → `text-destructive`, `bg-gray-50` → `bg-background` 등
