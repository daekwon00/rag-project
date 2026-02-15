# RAG Chat — 배포 가이드 (Self-hosting)

이 문서는 RAG Chat 애플리케이션을 직접 배포하기 위한 단계별 가이드입니다.

---

## 목차

1. [필수 요구사항](#1-필수-요구사항)
2. [Supabase 설정](#2-supabase-설정)
3. [환경변수 설정](#3-환경변수-설정)
4. [Vercel 배포](#4-vercel-배포)
5. [로컬 개발 환경](#5-로컬-개발-환경)
6. [선택사항](#6-선택사항)
7. [트러블슈팅](#7-트러블슈팅)

---

## 1. 필수 요구사항

- **Node.js** 20 이상
- **npm** (Node.js에 포함)
- **Supabase 계정** — [supabase.com](https://supabase.com) (무료 플랜 사용 가능)
- **OpenAI API 키** — [platform.openai.com](https://platform.openai.com)에서 발급
- **GitHub 계정** — Vercel 배포 시 필요

---

## 2. Supabase 설정

### 2-1. 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. **New Project**를 클릭합니다.
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전을 설정하고 **Create new project**를 클릭합니다.
4. 프로젝트 생성이 완료될 때까지 기다립니다 (약 1-2분).

### 2-2. pgvector 확장 활성화

Supabase Dashboard에서 **SQL Editor**로 이동한 후 다음 SQL을 실행합니다:

```sql
create extension if not exists vector;
```

### 2-3. RAG 테이블 생성 (resources, embeddings, match_embeddings)

SQL Editor에서 다음 SQL을 실행합니다:

```sql
-- 리소스 테이블 (원본 문서 메타데이터)
create table resources (
  id bigserial primary key,
  name text not null,
  content text not null,
  chunk_count integer not null default 0,
  created_at timestamptz default now()
);

-- 임베딩 테이블 (문서 조각 + 벡터)
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

### 2-4. 대화/메시지 테이블 생성 (conversations, messages, RLS, 인덱스)

SQL Editor에서 다음 SQL을 실행합니다:

```sql
-- 대화 테이블
CREATE TABLE conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT '새 대화',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 메시지 테이블
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS 정책
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own conversations"
  ON conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own messages"
  ON messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- 인덱스
CREATE INDEX idx_conversations_user ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

### 2-5. Auth 설정

1. Supabase Dashboard에서 **Authentication** > **Providers**로 이동합니다.
2. **Email** 프로바이더가 활성화되어 있는지 확인합니다.
3. **Authentication** > **URL Configuration**에서 **Site URL**을 설정합니다:
   - 로컬 개발: `http://localhost:3000`
   - Vercel 배포: `https://your-project.vercel.app`

### 2-6. API 키 확인

1. Supabase Dashboard에서 **Settings** > **API**로 이동합니다.
2. 다음 값을 확인하고 복사합니다:
   - **Project URL** — `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon (public) key** — `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용
   - **service_role (secret) key** — `SUPABASE_SERVICE_ROLE_KEY`에 사용

> **주의**: `service_role` 키는 RLS를 우회합니다. 절대 클라이언트 코드에 노출하지 마세요.

---

## 3. 환경변수 설정

아래 환경변수를 설정해야 합니다. 로컬 개발 시 `.env.local` 파일에, Vercel 배포 시 프로젝트 설정에서 추가합니다.

```env
# 필수
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

| 변수 | 설명 | 필수 |
|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 (GPT-4o, text-embedding-3-small 사용) | O |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | O |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (RAG 파이프라인용) | O |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 (인증, 대화/메시지용) | O |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (Rate Limiting) | X |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis 토큰 | X |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (에러 모니터링) | X |

---

## 4. Vercel 배포

### 4-1. GitHub에 저장소 준비

1. 이 프로젝트를 GitHub 저장소에 push합니다.

### 4-2. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 GitHub 계정으로 로그인합니다.
2. **Add New** > **Project**를 클릭합니다.
3. GitHub 저장소를 선택하고 **Import**합니다.

### 4-3. 환경변수 추가

1. Vercel 프로젝트 설정에서 **Settings** > **Environment Variables**로 이동합니다.
2. [3. 환경변수 설정](#3-환경변수-설정)의 필수 환경변수 4개를 추가합니다:
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4-4. 배포

1. **Deploy**를 클릭하면 자동으로 빌드 및 배포가 진행됩니다.
2. 배포 완료 후 Supabase Dashboard의 **Authentication** > **URL Configuration**에서 **Site URL**을 Vercel 도메인으로 업데이트합니다.
3. 이후 GitHub에 push할 때마다 자동으로 재배포됩니다.

---

## 5. 로컬 개발 환경

### 5-1. 저장소 클론

```bash
git clone https://github.com/daekwon00/rag-project.git
cd rag-project
```

### 5-2. 의존성 설치

```bash
npm install
```

### 5-3. 환경변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5-4. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션에 접속합니다.

---

## 6. 선택사항

### 6-1. Upstash Redis (Rate Limiting)

API 요청 속도 제한을 적용하려면 Upstash Redis를 설정합니다.

1. [Upstash Console](https://console.upstash.com)에서 계정을 만듭니다.
2. **Redis** 데이터베이스를 생성합니다.
3. **REST API** 섹션에서 URL과 Token을 복사합니다.
4. 환경변수에 추가합니다:

```env
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
```

> Redis를 설정하지 않아도 애플리케이션은 정상 동작합니다.

### 6-2. Sentry (에러 모니터링)

프로덕션 환경의 에러를 추적하려면 Sentry를 설정합니다.

1. [Sentry](https://sentry.io)에서 계정을 만들고 프로젝트를 생성합니다 (Next.js 선택).
2. DSN 값을 복사합니다.
3. 환경변수에 추가합니다:

```env
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

> Sentry DSN이 설정되지 않으면 Sentry는 자동으로 비활성화됩니다.

---

## 7. 트러블슈팅

### "Invalid API Key" 에러

- `OPENAI_API_KEY`가 올바른지 확인합니다.
- OpenAI 계정에 크레딧이 남아있는지 확인합니다.
- API 키가 `sk-`로 시작하는지 확인합니다.

### Supabase 연결 실패

- `NEXT_PUBLIC_SUPABASE_URL`이 `https://xxx.supabase.co` 형식인지 확인합니다.
- `SUPABASE_SERVICE_ROLE_KEY`와 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 올바른 프로젝트의 키인지 확인합니다.
- Supabase 프로젝트가 활성 상태인지 확인합니다 (무료 플랜은 비활성화될 수 있음).

### "relation does not exist" 에러

- [2-3](#2-3-rag-테이블-생성-resources-embeddings-match_embeddings)과 [2-4](#2-4-대화메시지-테이블-생성-conversations-messages-rls-인덱스)의 SQL을 모두 실행했는지 확인합니다.
- pgvector 확장이 활성화되었는지 확인합니다: `create extension if not exists vector;`

### 로그인/회원가입이 동작하지 않음

- Supabase Dashboard에서 **Authentication** > **Providers** > **Email**이 활성화되어 있는지 확인합니다.
- **Site URL**이 올바르게 설정되어 있는지 확인합니다 (로컬: `http://localhost:3000`, 배포: Vercel 도메인).

### 임베딩/검색이 동작하지 않음

- `match_embeddings` 함수가 생성되었는지 확인합니다.
- `embeddings` 테이블에 데이터가 있는지 확인합니다.
- 문서를 업로드한 후 검색을 시도합니다.

### Vercel 빌드 실패

- Vercel 프로젝트의 환경변수가 모두 설정되어 있는지 확인합니다.
- `NEXT_PUBLIC_` 접두사가 필요한 변수에 올바르게 붙어있는지 확인합니다.
- 빌드 로그에서 구체적인 에러 메시지를 확인합니다.

### PDF 업로드 실패

- 파일 크기가 너무 크지 않은지 확인합니다.
- PDF 파일이 손상되지 않았는지 확인합니다.
- 서버 로그에서 `pdf-parse` 관련 에러를 확인합니다.
