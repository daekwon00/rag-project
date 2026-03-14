# Phase 3.5 - Step 02: Dashboard/Main Page/Sidebar semantic 테마 전환

## 목표
- 하드코딩된 Tailwind 색상을 shadcn/ui semantic 토큰으로 전환

## 작업 항목
- [x] 테마 컬러 시스템 조정 (`globals.css`):
  - primary/accent/ring → blue 계열, body에 `text-foreground` 추가
- [x] Dashboard (`app/dashboard/page.tsx`):
  - 텍스트 아이콘 → lucide 아이콘, raw div → Card/Skeleton, 색상 → semantic 토큰
- [x] Main Page (`app/page.tsx`):
  - ThemeToggle → Button + lucide Sun/Moon, 배지 → Badge, 네비 → Button ghost
- [x] Sidebar (`components/sidebar.tsx`):
  - 인라인 SVG 5개 → lucide (X, Plus, Trash2, FileText, BarChart3)
  - active/hover 상태 → accent/accent-foreground
- [x] 다크모드 이슈 수정:
  - ghost 버튼 텍스트 → `text-muted-foreground` 명시
  - body `text-foreground` 누락 수정

## 완료 조건
- Dashboard/Main Page/Sidebar에서 하드코딩 색상 제거
- 라이트/다크 모드 정상 표시

## 참고
- 커밋: `cbfd2dd`
- 색상 매핑: bg-gray-50 → bg-background, text-gray-500 → text-muted-foreground 등
- 5 files changed, +242/-133
