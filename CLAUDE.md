# RAG Chat — 문서 기반 질의응답 시스템

## 프로젝트 개요
- **회사**: UDKsoft
- **프로덕션**: https://rag-project-navy.vercel.app
- **GitHub**: https://github.com/daekwon00/rag-project (SSH, daekwon00 계정)
- **Supabase**: https://dtbcgvuasxkovhzqtuhz.supabase.co

## 기술 스택
- Next.js 14 (App Router) + TypeScript
- Vercel AI SDK (`ai`, `@ai-sdk/openai`) — streamText, useChat, embed/embedMany
- LLM: GPT-4o / 임베딩: text-embedding-3-small (1536 dim)
- Supabase PostgreSQL + pgvector (벡터 유사도 검색)
- Supabase Auth (`@supabase/ssr`) — 이메일/비밀번호 인증
- TailwindCSS, pdf-parse
- Vercel 배포 (GitHub push → 자동 배포)

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 메인 페이지 (사이드바 + 채팅 레이아웃) |
| `app/login/page.tsx` | 로그인 페이지 |
| `app/signup/page.tsx` | 회원가입 페이지 |
| `app/auth/callback/route.ts` | 이메일 확인 콜백 |
| `app/api/chat/route.ts` | RAG 쿼리 + 스트리밍 응답 (인증 필수) |
| `app/api/ingest/route.ts` | 문서 수집 (청킹 + 임베딩, 인증 필수) |
| `app/api/conversations/route.ts` | 대화 CRUD (GET/POST/DELETE) |
| `app/api/conversations/[id]/messages/route.ts` | 메시지 조회/저장 |
| `middleware.ts` | 인증 미들웨어 (세션 리프레시, 리다이렉트) |
| `lib/supabase/server.ts` | 서버용 Supabase 클라이언트 (@supabase/ssr) |
| `lib/supabase/client.ts` | 브라우저용 Supabase 클라이언트 |
| `lib/ai/embedding.ts` | 임베딩 생성, 유사도 검색 |
| `lib/db/index.ts` | Supabase 서비스 역할 키 클라이언트 (RAG 전용) |
| `lib/db/schema.ts` | 테이블 스키마 + SQL (resources, embeddings, conversations, messages) |
| `lib/chunker.ts` | 문서 청킹 (500자, 100자 오버랩) |
| `components/chat.tsx` | 채팅 UI (대화 저장/로드, 업로드, 에러 처리) |
| `components/sidebar.tsx` | 사이드바 (대화 목록, 새 대화, 삭제) |

## 아키텍처

### 이중 Supabase 클라이언트
- `lib/db/index.ts`: 서비스 역할 키 → RAG 파이프라인 전용 (임베딩, 리소스)
- `lib/supabase/`: anon key + `@supabase/ssr` → 인증, 대화/메시지 (RLS 적용)

### 인증 흐름
```
미인증 → middleware → /login 리다이렉트
로그인 → Supabase Auth → 쿠키 세션 → / 리다이렉트
API 요청 → 서버 클라이언트로 세션 확인
```

### 대화 저장 흐름
```
첫 메시지 → createConversation(title) → convIdRef에 저장
사용자 메시지 → onSubmit에서 DB 저장 → useChat handleSubmit
어시스턴트 응답 → onFinish 콜백에서 DB 저장
대화 전환 → key={conversationId}로 리마운트 → initialMessages로 로드
```

## RAG 파이프라인
```
수집: 파일 업로드 → 청킹 → [출처: 파일명]\n청크 형태로 임베딩 → Supabase 저장
검색: 질문 임베딩 → pgvector 코사인 유사도 검색 (threshold 0.2) → 상위 5개
응답: 관련 문서 + 시스템 프롬프트 → GPT-4o 스트리밍
```

## DB 구조
- `resources`: 원본 문서 메타데이터 (id, content, source, created_at)
- `embeddings`: 청크 벡터 (id, resource_id, content, embedding vector(1536))
- `match_embeddings`: 유사도 검색 SQL 함수 (cosine distance `<=>`)
- `conversations`: 대화 세션 (id, user_id, title, created_at, updated_at) — RLS
- `messages`: 대화 메시지 (id, conversation_id, role, content, created_at) — RLS

## 환경변수 (.env.local)
```
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## 개발 참고
- `npm run dev`로 로컬 서버 실행 (localhost:3000)
- PDF 업로드 시 pdf-parse 사용, `lib/pdf-parse.d.ts` 타입 선언 필요
- 임베딩에 출처명 포함하여 파일명 기반 검색 지원
- conversations/messages 테이블은 Supabase SQL Editor에서 직접 생성 필요 (schema.ts 주석 참조)
- Supabase Auth → Providers → Email 활성화 필요
- 옵시디안 문서: `~/Documents/ObsidianVaults/DkVault/1_Projects/DK-Dev/Claude/rag-project/`
