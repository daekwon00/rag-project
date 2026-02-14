# RAG Chat — 문서 기반 질의응답 시스템

> 문서를 업로드하면 RAG(Retrieval-Augmented Generation) 기반으로 질문에 답변하는 채팅 시스템

## 주요 기능

- 문서 업로드: `.txt`, `.md`, `.pdf` 파일 지원
- 자동 청킹: 문서를 적절한 크기로 분할 (500자 단위, 100자 오버랩)
- 벡터 임베딩: OpenAI `text-embedding-3-small`로 벡터 변환 후 저장
- 유사도 검색: pgvector 코사인 유사도로 관련 문서 조각 검색
- 스트리밍 응답: GPT-4o가 검색된 문서 기반으로 실시간 답변 생성
- 출처 표시: 답변에 참조한 문서 출처를 `[출처 N]` 형태로 표시

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router, TypeScript) |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Vector DB | Supabase (PostgreSQL + pgvector) |
| 임베딩 | OpenAI `text-embedding-3-small` (1536 dim) |
| LLM | GPT-4o |
| UI | TailwindCSS |
| PDF 파싱 | pdf-parse |

## 아키텍처

```
[사용자] → [Chat UI (useChat)] → [POST /api/chat]
                                       ↓
                                  질문 임베딩 생성
                                       ↓
                                  pgvector 유사도 검색
                                       ↓
                                  관련 문서 조각 수집
                                       ↓
                                  시스템 프롬프트에 컨텍스트 삽입
                                       ↓
                                  GPT-4o 스트리밍 응답
                                       ↓
                                  [사용자에게 답변 + 출처]
```

## 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.local.example .env.local
```
`.env.local` 파일에 실제 키를 입력합니다:
```
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 3. Supabase 설정
Supabase SQL Editor에서 아래 SQL을 실행합니다:
```sql
-- pgvector 확장 활성화
create extension if not exists vector;

-- 리소스 테이블
create table resources (
  id bigserial primary key,
  name text not null,
  content text not null,
  chunk_count integer not null default 0,
  created_at timestamptz default now()
);

-- 임베딩 테이블
create table embeddings (
  id bigserial primary key,
  content text not null,
  source text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- 유사도 검색 함수
create or replace function match_embeddings(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id bigint,
  content text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content,
    embeddings.source,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by (embeddings.embedding <=> query_embedding) asc
  limit match_count;
$$;
```

### 4. 개발 서버 실행
```bash
npm run dev
```
`http://localhost:3000` 에서 확인합니다.

### 5. 문서 업로드
- 웹 UI에서 파일 선택 → 문서 업로드 버튼
- 또는 API 직접 호출:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -F "file=@./data/sample-docs/example.txt"
```

## 프로젝트 구조

```
rag-project/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 메인 페이지
│   ├── globals.css             # 글로벌 스타일
│   └── api/
│       ├── chat/route.ts       # RAG 쿼리 + 스트리밍 응답
│       └── ingest/route.ts     # 문서 수집 (청킹 + 임베딩)
├── lib/
│   ├── ai/embedding.ts         # 임베딩 생성, 유사도 검색
│   ├── db/
│   │   ├── index.ts            # Supabase 클라이언트
│   │   └── schema.ts           # 테이블 스키마 + SQL
│   └── chunker.ts              # 문서 청킹 유틸
├── components/
│   └── chat.tsx                # 채팅 UI 컴포넌트
└── data/sample-docs/           # 샘플 문서
```

## 핵심 구현 포인트

### 문서 청킹 전략
- 500자 단위 분할, 100자 오버랩으로 문맥 유지
- 문장 경계에서 분할하여 의미 단위 보존

### 임베딩 + 출처 포함
- 임베딩 생성 시 `[출처: 파일명]` 을 텍스트에 포함
- 파일명 기반 질문에도 유사도 검색이 가능

### 유사도 검색 최적화
- 코사인 유사도 임계값 0.2로 설정 (낮은 임계값으로 넓은 검색)
- 상위 5개 문서 조각을 컨텍스트로 활용
