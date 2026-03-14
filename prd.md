# RAG Chat — Product Requirements Document

## 개요
문서 기반 질의응답 시스템. 사용자가 업로드한 문서를 RAG(검색+생성) 방식으로 분석하여 GPT-4o 스트리밍 답변을 제공한다.

- **회사**: UDKsoft
- **프로덕션**: https://rag-project-navy.vercel.app
- **GitHub**: https://github.com/daekwon00/rag-project

## 목표
- 문서 업로드 → RAG 기반 정확한 질의응답 제공
- 직관적이고 일관된 UI/UX (shadcn/ui 디자인 시스템)
- 프로덕션 수준의 코드 품질 및 안정성
- 모바일/다국어 지원

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- Vercel AI SDK + GPT-4o + text-embedding-3-small (1536 dim)
- Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- Supabase Auth (이메일/비밀번호)
- TailwindCSS + shadcn/ui + lucide-react
- Upstash Redis (Rate Limiting)
- Vitest (74개 테스트), GitHub Actions CI/CD
- Sentry 에러 모니터링
- Vercel 배포

## 기능 요구사항

### 핵심 기능 (완료)
- 사용자 인증 (이메일/비밀번호, Supabase Auth)
- 문서 업로드 (PDF, TXT, MD, DOCX, PPTX)
- RAG 기반 질의응답 (GPT-4o 스트리밍)
- 대화 저장/로드/삭제
- 마크다운 렌더링 (코드 하이라이트)
- 다크 모드
- 대화 히스토리 기반 검색 (맥락 강화)
- 문서 관리 대시보드 (/documents)
- 출처 하이라이트 (접이식 출처 표시)
- Hybrid Search (벡터 + BM25 RRF)
- LLM Re-ranking (GPT-4o-mini)
- Rate Limiting (Upstash Redis)
- 대화 내보내기 (마크다운)
- 대시보드 통계 (/dashboard)
- 다국어 (한국어/영어)
- PWA 지원

### UI/UX 개선 (진행 중)
- shadcn/ui 디자인 시스템 마이그레이션 (Chat 완료, 나머지 페이지 미완)
- Login/Signup 페이지 semantic 토큰 전환
- Documents 페이지 리팩토링
- markdown-body CSS variable 전환

### 부가 기능 (백로그)
- 문서 태그/카테고리 관리
- 대화 공유 기능 (URL)
- 파일 드래그 앤 드롭 업로드
- 북마크/즐겨찾기
- 검색 히스토리
- 커스텀 프롬프트 템플릿
- 음성 입력 (Web Speech API)

## 비기능 요구사항
- Rate Limiting: chat 20/min, ingest 5/min, docs 10/min
- CI/CD: GitHub Actions (tsc + vitest)
- 에러 모니터링: Sentry (graceful degradation)
- 테스트 커버리지: Vitest 74개 테스트
- 코드 품질: ESLint/Prettier 강화, Husky pre-commit
- 성능: Lighthouse 90+ 목표, 번들 최적화
