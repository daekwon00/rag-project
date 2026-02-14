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
- TailwindCSS, pdf-parse
- Vercel 배포 (GitHub push → 자동 배포)

## 핵심 파일
| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 메인 페이지 (UDKsoft 브랜딩) |
| `app/api/chat/route.ts` | RAG 쿼리 + 스트리밍 응답 |
| `app/api/ingest/route.ts` | 문서 수집 (청킹 + 임베딩) |
| `lib/ai/embedding.ts` | 임베딩 생성, 유사도 검색 |
| `lib/db/index.ts` | Supabase 클라이언트 (match_threshold: 0.2) |
| `lib/db/schema.ts` | 테이블 스키마 + SQL |
| `lib/chunker.ts` | 문서 청킹 (500자, 100자 오버랩) |
| `components/chat.tsx` | 채팅 UI (업로드, 에러 처리, 자동 스크롤) |

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

## 환경변수 (.env.local)
```
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## 개발 참고
- `npm run dev`로 로컬 서버 실행 (localhost:3000)
- PDF 업로드 시 pdf-parse 사용, `lib/pdf-parse.d.ts` 타입 선언 필요
- 임베딩에 출처명 포함하여 파일명 기반 검색 지원
- 옵시디안 문서: `~/Documents/ObsidianVaults/DkVault/1_Projects/Ai-Docs/Claude/rag-project/`
