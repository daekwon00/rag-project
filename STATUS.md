# RAG Chat — Status

> 마지막 업데이트: 2026-02-15

---

## 현재 작업

- [ ] 미커밋 변경사항 커밋 (Phase 2 작업 포함, 8개 파일 +142/-43)
- [ ] Supabase SQL 실행 (conversations/messages 테이블 — `lib/db/schema.ts` 참조)
- [ ] 동작 테스트
  - [ ] 대화 히스토리 기반 검색 (2-1): 이전 맥락 연관 후속 질문 시 검색 정확도
  - [ ] 문서 관리 대시보드 (2-2): `/documents` 문서 목록/삭제
  - [ ] 스트리밍 UI (3-2): 스트리밍 중 마크다운 렌더링 + 중지 버튼
  - [ ] 기존 기능: 로그인, 대화 저장/로드, 마크다운, 다크 모드

---

## 완료된 작업

### Phase 0: 기반 구축 (2026-02-14)

- [x] Next.js 14 프로젝트 초기화 + Vercel 배포
- [x] Supabase pgvector + 문서 수집 파이프라인
- [x] RAG 쿼리 API (스트리밍) + 채팅 UI
- [x] PDF 업로드, 에러 핸들링, UI 고도화

### Phase 1: Next.js 앱 확장 (2026-02-14~15)

- [x] **1-1. 사용자 인증** — Supabase Auth, 로그인/회원가입
- [x] **1-2. 대화 저장/관리** — 사이드바, conversations/messages DB
- [x] **1-3. 마크다운 렌더링** — react-markdown + 코드 하이라이트
- [x] **1-4. 다크 모드** — Tailwind dark mode
- [x] 보안/품질 개선 10건 (소유권 검증, 입력 검증, 파일 크기 제한, 접근성 등)

### Phase 2 & 3 일부 (2026-02-15, 병렬 팀 작업)

- [x] **2-1. 대화 히스토리 기반 검색** — 최근 3쌍 맥락 강화 쿼리, findRelevantContent 확장 (하위호환)
  - 수정: `app/api/chat/route.ts`, `lib/ai/embedding.ts`
- [x] **2-2. 문서 관리 대시보드** — `/documents` 페이지 (목록/삭제), API, DB 메서드
  - 신규: `app/api/documents/route.ts`, `app/documents/page.tsx`
  - 수정: `lib/db/index.ts`, `app/page.tsx`
- [x] **3-2. 스트리밍 UI 개선** — 실시간 마크다운 렌더링, 타이핑 커서, 중지 버튼
  - 수정: `components/chat.tsx`, `app/globals.css`

---

## 다음 작업

### 우선순위 높음

- [ ] **2-3. 출처 하이라이트** — 사용된 청크 원문 표시 (1-3 완료로 가능)
- [ ] **3-3. 테스트 코드** — Vitest 설정 + 단위 테스트 (독립, 중요도 높음)
- [ ] **3-1. Rate Limiting** — Upstash Redis (보안 중요)

### 그 다음

- [ ] **2-4. 청킹 전략 개선** — 헤딩 기반, 코드 블록 보존
- [ ] **2-5. Hybrid Search** — 벡터 + BM25 결합
- [ ] **2-6. Re-ranking** — Cross-encoder 재정렬
- [ ] **2-7. 멀티모달 문서** — DOCX, PPTX, OCR

### Phase 1 나머지

- [ ] **1-5. 대시보드 페이지** — 사용 통계 시각화
- [ ] **1-6. 대화 내보내기** — PDF/MD 다운로드
- [ ] **1-7. 모바일 최적화/PWA**
- [ ] **1-8. 다국어 지원(i18n)**

### Phase 3 나머지

- [ ] **3-4. CI/CD 파이프라인** — GitHub Actions (3-3 의존)
- [ ] **3-5. 에러 모니터링** — Sentry

---

## 상세 문서

- 작업현황판: `~/Documents/ObsidianVaults/DkVault/1_Projects/AI-Docs/Claude-Docs/rag-project/작업현황판.md`
- TODO: `~/Documents/ObsidianVaults/DkVault/1_Projects/AI-Docs/Claude-Docs/rag-project/TODO.md`
- 프로젝트 CLAUDE.md: `/Users/ydk/workspace/rag-project/CLAUDE.md`
