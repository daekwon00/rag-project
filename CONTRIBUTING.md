# Contributing to RAG Chat

RAG Chat은 문서 기반 질의응답 시스템입니다. 업로드한 문서를 임베딩하여 벡터 검색 기반으로 GPT-4o가 답변을 생성합니다.

**기술 스택:** Next.js 14 (App Router) · TypeScript · TailwindCSS · Supabase (PostgreSQL + pgvector) · Vercel AI SDK · OpenAI GPT-4o

기여에 관심을 가져주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 목차

- [개발 환경 설정](#개발-환경-설정)
- [프로젝트 구조](#프로젝트-구조)
- [코드 스타일 및 컨벤션](#코드-스타일-및-컨벤션)
- [테스트](#테스트)
- [PR 프로세스](#pr-프로세스)
- [이슈 리포팅](#이슈-리포팅)
- [라이선스](#라이선스)

## 개발 환경 설정

### 필수 도구

- **Node.js** 20 이상
- **npm** (Node.js에 포함)

### 설치

```bash
# 1. 저장소 포크 후 클론
git clone https://github.com/<your-username>/rag-project.git
cd rag-project

# 2. 의존성 설치
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 키를 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

> **참고:** Supabase 프로젝트에서 `conversations`, `messages`, `resources`, `embeddings` 테이블과 `match_embeddings` SQL 함수를 생성해야 합니다. 스키마는 `lib/db/schema.ts`의 주석을 참조하세요.

### 로컬 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

## 프로젝트 구조

```
rag-project/
├── app/                    # Next.js App Router 페이지 및 API 라우트
│   ├── api/
│   │   ├── chat/           # RAG 쿼리 + 스트리밍 응답 API
│   │   ├── ingest/         # 문서 수집 (청킹 + 임베딩) API
│   │   └── conversations/  # 대화 CRUD API
│   ├── login/              # 로그인 페이지
│   ├── signup/             # 회원가입 페이지
│   ├── dashboard/          # 사용량 대시보드
│   └── documents/          # 문서 관리
├── components/             # React 컴포넌트 (chat.tsx, sidebar.tsx)
├── lib/                    # 유틸리티 및 비즈니스 로직
│   ├── ai/                 # 임베딩 생성, 유사도 검색
│   ├── db/                 # Supabase 서비스 역할 클라이언트, 스키마
│   ├── i18n/               # 다국어 지원 (translations, useTranslation)
│   ├── search/             # BM25 검색, 리랭커
│   ├── supabase/           # Supabase 클라이언트 (서버/브라우저)
│   ├── chunker.ts          # 문서 청킹 로직
│   └── rate-limit.ts       # Rate limiting (Upstash Redis)
├── __tests__/              # 테스트 파일
│   ├── api/                # API 라우트 테스트
│   └── lib/                # 라이브러리 유닛 테스트
├── public/                 # 정적 파일
└── docs/                   # 프로젝트 문서
```

## 코드 스타일 및 컨벤션

### TypeScript

- **Strict mode** 활성화 (`tsconfig.json`의 `"strict": true`)
- 경로 별칭 `@/*`을 사용합니다 (예: `import { chunkText } from "@/lib/chunker"`)
- `any` 타입 사용을 지양하세요

### 스타일링

- **TailwindCSS** 유틸리티 클래스를 사용합니다
- **다크 모드**: 반드시 `dark:` 접두사 클래스를 함께 추가하세요

```tsx
// Good
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">

// Bad - 다크 모드 미지원
<div className="bg-white text-gray-900">
```

### 네이밍 컨벤션

| 대상 | 규칙 | 예시 |
|------|------|------|
| 파일명 | kebab-case | `rate-limit.ts`, `use-translation.ts` |
| 함수/변수 | camelCase | `chunkText`, `embedMany` |
| 컴포넌트 | PascalCase | `ChatComponent`, `Sidebar` |
| 상수 | UPPER_SNAKE_CASE | `MAX_CHUNK_SIZE` |

### 다국어 (i18n)

- UI 텍스트는 한국어가 기본입니다
- 새로운 UI 텍스트를 추가할 때는 `lib/i18n/translations.ts`에 키를 등록하고 `useTranslation` 훅을 사용하세요

## 테스트

### 테스트 실행

```bash
# 전체 테스트 실행
npm run test

# Watch 모드로 실행
npm run test:watch
```

### 테스트 구조

- 테스트 파일은 `__tests__/` 디렉토리에 소스 파일과 동일한 경로 구조로 배치합니다
- 예: `lib/chunker.ts` → `__tests__/lib/chunker.test.ts`
- 테스트 프레임워크: **Vitest**

### 테스트 작성 가이드

```typescript
import { describe, it, expect, vi } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("기대하는 동작을 설명한다", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

- `describe` 블록으로 테스트 대상을 그룹화합니다
- `it` 설명은 한국어로 작성합니다
- 외부 의존성은 `vi.mock()`으로 모킹합니다
- **새로운 기능을 추가할 때는 반드시 테스트를 함께 작성하세요**

## PR 프로세스

### 워크플로우

1. **Fork** — GitHub에서 저장소를 포크합니다
2. **Branch** — 기능 브랜치를 생성합니다
   ```bash
   git checkout -b feat/my-feature
   ```
3. **작업** — 코드를 작성합니다
4. **검증** — 로컬에서 테스트와 타입 체크를 실행합니다
   ```bash
   npm run test
   npx tsc --noEmit
   ```
5. **PR 생성** — main 브랜치로 Pull Request를 생성합니다

### 브랜치 네이밍

| 타입 | 형식 | 예시 |
|------|------|------|
| 기능 | `feat/기능명` | `feat/pdf-preview` |
| 버그 수정 | `fix/버그명` | `fix/upload-error` |
| 문서 | `docs/내용` | `docs/api-guide` |
| 리팩토링 | `refactor/대상` | `refactor/chunker` |

### PR 제목 형식

```
<type>: <설명>
```

예시:
- `feat: PDF 미리보기 기능 추가`
- `fix: 파일 업로드 시 인코딩 오류 수정`
- `docs: API 사용법 문서 추가`
- `refactor: 청킹 로직 개선`

### CI 체크

PR을 생성하면 GitHub Actions가 자동으로 다음을 검사합니다:

- **타입 체크**: `npx tsc --noEmit`
- **테스트**: `npm run test`

CI가 통과해야 PR 머지가 가능합니다.

### 코드 리뷰

- 모든 PR은 코드 리뷰를 거칩니다
- 리뷰어의 피드백을 반영한 후 re-request review를 해주세요

## 이슈 리포팅

### 버그 리포트

버그를 발견하셨다면 [GitHub Issues](https://github.com/daekwon00/rag-project/issues)에 다음 정보와 함께 리포트해주세요:

```markdown
## 버그 설명
<!-- 어떤 문제가 발생했는지 간략히 설명해주세요 -->

## 재현 방법
1. '...'로 이동
2. '...'을 클릭
3. '...'을 입력
4. 오류 발생

## 기대 동작
<!-- 어떻게 동작해야 하는지 설명해주세요 -->

## 실제 동작
<!-- 실제로 어떻게 동작했는지 설명해주세요 -->

## 환경
- OS: [예: macOS 15.0]
- 브라우저: [예: Chrome 131]
- Node.js: [예: v20.10.0]
```

### 기능 요청

새로운 기능을 제안하려면 다음 형식으로 이슈를 생성해주세요:

```markdown
## 기능 설명
<!-- 원하는 기능을 설명해주세요 -->

## 배경
<!-- 왜 이 기능이 필요한지 설명해주세요 -->

## 제안하는 구현 방법 (선택사항)
<!-- 구현 아이디어가 있다면 공유해주세요 -->
```

## 라이선스

이 프로젝트에 기여하면 해당 기여물은 프로젝트와 동일한 MIT 라이선스 조건 하에 배포됩니다.
