# Progress

## Phase 0: 기반 구축 + 배포 (완료)
- [x] Step 01: 프로젝트 셋업 및 기반 구축
- [x] Step 02: RAG 파이프라인 구현
- [x] Step 03: 채팅 UI 및 Vercel 배포

## Phase 1: Next.js 앱 확장 (완료)
- [x] Step 01: 사용자 인증 (Supabase Auth)
- [x] Step 02: 대화 저장/관리 (사이드바, DB)
- [x] Step 03: 마크다운 렌더링 (react-markdown + 코드 하이라이트)
- [x] Step 04: 다크 모드 (Tailwind dark mode)
- [x] Step 05: 대시보드 페이지 (/dashboard 통계)
- [x] Step 06: 대화 내보내기 (마크다운 다운로드)
- [x] Step 07: 모바일/PWA (manifest.json, SVG 아이콘)
- [x] Step 08: 다국어 i18n (한국어/영어 전환)

## Phase 2: RAG 파이프라인 고도화 (완료)
- [x] Step 01: 대화 히스토리 기반 검색 (맥락 강화)
- [x] Step 02: 문서 관리 대시보드 (/documents)
- [x] Step 03: 출처 하이라이트 (접이식 출처 표시)
- [x] Step 04: 청킹 전략 개선 (헤딩 기반 + 코드 블록 보존)
- [x] Step 05: Hybrid Search (벡터 + BM25 RRF)
- [x] Step 06: Re-ranking (GPT-4o-mini LLM 기반)
- [x] Step 07: 멀티모달 문서 (DOCX + PPTX)

## Phase 3: 기술적 개선 (완료)
- [x] Step 01: Rate Limiting (Upstash Redis)
- [x] Step 02: 스트리밍 UI 개선 (마크다운 + 커서 + 중지 버튼)
- [x] Step 03: 테스트 코드 (Vitest 74개)
- [x] Step 04: CI/CD 파이프라인 (GitHub Actions)
- [x] Step 05: 에러 모니터링 (Sentry)

## Phase 3.5: shadcn/ui 디자인 시스템 도입 (완료)
- [x] Step 01: shadcn/ui 설치 및 Chat 모듈 분리
- [x] Step 02: Dashboard/Main Page/Sidebar semantic 테마 전환

## Phase 4: UI/UX 완성
- [x] Step 01: Login/Signup 페이지 semantic 마이그레이션
- [x] Step 02: Documents 페이지 리팩토링
- [x] Step 03: markdown-body CSS variable 전환
- [ ] Step 04: 반응형 모바일 UI 점검 및 개선

## Phase 5: 사용자 경험 강화
- [ ] Step 01: 파일 드래그 앤 드롭 업로드
- [ ] Step 02: 문서 태그/카테고리 관리
- [ ] Step 03: 대화 공유 기능 (URL)
- [ ] Step 04: 북마크/즐겨찾기
- [ ] Step 05: 검색 히스토리
- [ ] Step 06: 커스텀 프롬프트 템플릿

## Phase 6: 코드 품질 강화
- [ ] Step 01: ESLint/Prettier 설정 강화
- [ ] Step 02: Husky pre-commit 훅
- [ ] Step 03: 번들 사이즈 분석 및 최적화
- [ ] Step 04: Lighthouse 점수 개선 (90+)
