# RAG Chat — 문서 기반 질의응답 시스템

> 3일 집중 프로젝트: 문서를 업로드하고 RAG 기반으로 질문에 답변하는 채팅 시스템

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router, TypeScript) |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| Vector DB | Supabase (PostgreSQL + pgvector) — 무료 티어 |
| 임베딩 | OpenAI `text-embedding-3-small` (1536 dim) |
| LLM | GPT-4o |
| UI | TailwindCSS |

## 3일 개발 계획

### Day 1: 기반 구축 + 문서 수집 파이프라인
- [x] Next.js 프로젝트 초기화
- [ ] Supabase 프로젝트 생성 + pgvector 활성화
- [ ] DB 스키마 (resources, embeddings 테이블)
- [ ] 문서 수집 API: 텍스트 → 청킹 → 임베딩 → 벡터 저장
- [ ] 샘플 문서 수집 테스트

### Day 2: RAG 쿼리 파이프라인 + 채팅 UI
- [ ] 유사도 검색 함수 (cosine similarity with pgvector)
- [ ] RAG 쿼리 API (질문 → 임베딩 → 검색 → LLM 응답)
- [ ] Vercel AI SDK `streamText` + `useChat` 스트리밍 채팅 UI
- [ ] 문서 업로드 UI
- [ ] 출처 표시 기능

### Day 3: 고도화 + 데모 준비
- [ ] PDF 파일 업로드 (pdf-parse)
- [ ] 에러 핸들링, 로딩 상태
- [ ] 데모용 샘플 데이터 준비
- [ ] Vercel 배포 또는 로컬 시연 준비
- [ ] README 정리 (포트폴리오용)

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

### 1. 환경 변수 설정
```bash
cp .env.local.example .env.local
# .env.local 파일에 API 키 입력
```

### 2. 의존성 설치 + 실행
```bash
npm install
npm run dev
```

### 3. Supabase 설정
Supabase SQL Editor에서 `lib/db/schema.ts` 상단 주석의 SQL을 실행합니다.

### 4. 문서 업로드
- 웹 UI에서 .txt, .pdf, .md 파일 업로드
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
│   ├── page.tsx                # 메인 페이지 (채팅 UI)
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
└── data/sample-docs/           # 테스트용 샘플 문서
```
