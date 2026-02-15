# RAG Chat API Reference

문서 기반 질의응답(RAG) 시스템의 REST API 문서입니다.

- **Base URL**: `https://rag-project-navy.vercel.app`
- **인증**: Supabase Auth 쿠키 기반 (모든 API 요청에 인증 필요)

---

## 목차

1. [인증](#인증)
2. [Rate Limiting](#rate-limiting)
3. [Chat](#chat)
4. [Documents](#documents)
5. [Conversations](#conversations)
6. [Messages](#messages)
7. [Stats](#stats)
8. [Export](#export)
9. [에러 코드](#에러-코드)

---

## 인증

모든 API 요청은 Supabase Auth 세션 쿠키가 필요합니다. 브라우저에서 로그인하면 쿠키가 자동으로 설정됩니다.

인증되지 않은 요청은 `401 Unauthorized` 응답을 받습니다.

### 로그인 (세션 쿠키 획득)

Supabase Auth를 통해 이메일/비밀번호로 로그인합니다. 로그인 성공 시 세션 쿠키가 설정되며, 이후 API 요청에 자동으로 포함됩니다.

---

## Rate Limiting

일부 엔드포인트에 사용자별 요청 횟수 제한이 적용됩니다. 제한 초과 시 `429 Too Many Requests` 응답과 함께 `Retry-After` 헤더가 반환됩니다.

| 엔드포인트 | 제한 | 방식 |
|-----------|------|------|
| `POST /api/chat` | 20회/분 | Sliding Window |
| `POST /api/ingest` | 5회/분 | Fixed Window |
| `DELETE /api/documents` | 10회/분 | Sliding Window |

Rate limit 초과 응답:

```json
{
  "error": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
}
```

---

## Chat

### `POST /api/chat`

업로드된 문서를 벡터 검색하여 관련 문서를 기반으로 GPT-4o 스트리밍 응답을 생성합니다.

**Rate Limit**: 20회/분

#### Request Body

```json
{
  "messages": [
    { "role": "user", "content": "이 문서의 핵심 내용을 요약해 주세요." }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `messages` | `ChatMessage[]` | Yes | 대화 메시지 배열 |
| `messages[].role` | `string` | Yes | `"user"` 또는 `"assistant"` |
| `messages[].content` | `string` | Yes | 메시지 내용 |

#### Response

`200 OK` — Vercel AI SDK Data Stream 형식의 스트리밍 응답.

메시지 어노테이션으로 소스 문서 정보가 포함됩니다:

```json
{
  "sources": [
    {
      "index": 1,
      "source": "report.pdf",
      "content": "관련 문서 내용 미리보기...",
      "similarity": 0.85
    }
  ]
}
```

#### curl 예시

```bash
curl -X POST https://rag-project-navy.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -d '{
    "messages": [
      { "role": "user", "content": "이 문서의 핵심 내용을 요약해 주세요." }
    ]
  }'
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `400` | `messages` 배열이 없거나 비어있음, 또는 유효한 content가 없음 |
| `401` | 인증 실패 |
| `429` | Rate limit 초과 |

---

## Documents

### `POST /api/ingest`

파일 또는 텍스트를 업로드하여 RAG 파이프라인에 수집합니다.

**지원 형식**: PDF, DOCX, PPTX, TXT, MD
**파일 크기 제한**: 10MB
**Rate Limit**: 5회/분

#### Request Body (multipart/form-data)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | `File` | No* | 업로드할 파일 |
| `text` | `string` | No* | 직접 입력 텍스트 |
| `source` | `string` | No | 출처명 (생략 시 파일명 또는 "직접 입력") |

\* `file` 또는 `text` 중 하나는 필수입니다.

#### Response

```json
{
  "message": "문서 수집 완료",
  "source": "report.pdf",
  "chunks": 12,
  "embeddings": 12
}
```

#### curl 예시

```bash
# 파일 업로드
curl -X POST https://rag-project-navy.vercel.app/api/ingest \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -F "file=@report.pdf"

# 텍스트 직접 입력
curl -X POST https://rag-project-navy.vercel.app/api/ingest \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -F "text=여기에 텍스트를 입력합니다." \
  -F "source=메모"
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `400` | 파일 크기 초과, 지원하지 않는 형식, 또는 file/text 모두 없음 |
| `401` | 인증 실패 |
| `429` | Rate limit 초과 |
| `500` | 문서 처리 중 서버 오류 |

---

### `GET /api/documents`

업로드된 문서 목록을 최신순으로 반환합니다.

#### Response

```json
[
  {
    "id": 1,
    "name": "report.pdf",
    "chunk_count": 12,
    "created_at": "2026-02-15T10:30:00Z"
  }
]
```

#### curl 예시

```bash
curl https://rag-project-navy.vercel.app/api/documents \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN"
```

---

### `DELETE /api/documents`

문서와 관련 임베딩을 삭제합니다.

**Rate Limit**: 10회/분

#### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | `integer` | Yes | 문서 ID |
| `source` | `string` | Yes | 문서 출처명 |

#### Response

```json
{
  "message": "문서가 삭제되었습니다."
}
```

#### curl 예시

```bash
curl -X DELETE "https://rag-project-navy.vercel.app/api/documents?id=1&source=report.pdf" \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN"
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `400` | `id` 또는 `source` 파라미터 누락 |
| `401` | 인증 실패 |
| `429` | Rate limit 초과 |
| `500` | 서버 오류 |

---

## Conversations

### `GET /api/conversations`

현재 사용자의 대화 목록을 최근 업데이트순으로 반환합니다.

#### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "문서 분석 요청",
    "created_at": "2026-02-15T10:00:00Z",
    "updated_at": "2026-02-15T10:30:00Z"
  }
]
```

#### curl 예시

```bash
curl https://rag-project-navy.vercel.app/api/conversations \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN"
```

---

### `POST /api/conversations`

새 대화 세션을 생성합니다.

#### Request Body

```json
{
  "title": "문서 분석 요청"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | `string` | No | 대화 제목 (기본값: `"새 대화"`) |

#### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "문서 분석 요청",
  "created_at": "2026-02-15T10:00:00Z",
  "updated_at": "2026-02-15T10:00:00Z"
}
```

#### curl 예시

```bash
curl -X POST https://rag-project-navy.vercel.app/api/conversations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -d '{ "title": "문서 분석 요청" }'
```

---

### `DELETE /api/conversations`

대화를 삭제합니다. 관련 메시지도 함께 삭제됩니다 (CASCADE).

#### Request Body

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | `string (uuid)` | Yes | 삭제할 대화 ID |

#### Response

```json
{
  "success": true
}
```

#### curl 예시

```bash
curl -X DELETE https://rag-project-navy.vercel.app/api/conversations \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -d '{ "id": "550e8400-e29b-41d4-a716-446655440000" }'
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `400` | 유효한 대화 ID가 없음 |
| `401` | 인증 실패 |
| `500` | 서버 오류 |

---

## Messages

### `GET /api/conversations/{id}/messages`

특정 대화의 메시지 목록을 시간순으로 반환합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `string (uuid)` | 대화 ID |

#### Response

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "role": "user",
    "content": "이 문서의 핵심 내용을 요약해 주세요.",
    "created_at": "2026-02-15T10:00:00Z"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "role": "assistant",
    "content": "문서의 핵심 내용은 다음과 같습니다...",
    "created_at": "2026-02-15T10:00:05Z"
  }
]
```

#### curl 예시

```bash
curl https://rag-project-navy.vercel.app/api/conversations/550e8400-e29b-41d4-a716-446655440000/messages \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN"
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `401` | 인증 실패 |
| `404` | 대화를 찾을 수 없음 (존재하지 않거나 소유권 불일치) |
| `500` | 서버 오류 |

---

### `POST /api/conversations/{id}/messages`

특정 대화에 메시지를 추가합니다. 대화의 `updated_at`이 자동으로 갱신됩니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `string (uuid)` | 대화 ID |

#### Request Body

```json
{
  "role": "user",
  "content": "이 문서의 핵심 내용을 요약해 주세요."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `role` | `string` | Yes | `"user"` 또는 `"assistant"` |
| `content` | `string` | Yes | 비어있지 않은 메시지 내용 |

#### Response

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "role": "user",
  "content": "이 문서의 핵심 내용을 요약해 주세요.",
  "created_at": "2026-02-15T10:00:00Z"
}
```

#### curl 예시

```bash
curl -X POST https://rag-project-navy.vercel.app/api/conversations/550e8400-e29b-41d4-a716-446655440000/messages \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -d '{ "role": "user", "content": "이 문서의 핵심 내용을 요약해 주세요." }'
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `400` | role이 유효하지 않거나 content가 비어있음 |
| `401` | 인증 실패 |
| `404` | 대화를 찾을 수 없음 |
| `500` | 서버 오류 |

---

## Stats

### `GET /api/stats`

사용자의 사용 통계를 반환합니다. 대화 수, 메시지 수, 문서 수, 청크 수, 최근 7일 일별 메시지 활동량을 포함합니다.

#### Response

```json
{
  "totalConversations": 5,
  "totalMessages": 42,
  "totalDocuments": 3,
  "totalChunks": 36,
  "recentActivity": [
    { "date": "2026-02-09", "count": 0 },
    { "date": "2026-02-10", "count": 5 },
    { "date": "2026-02-11", "count": 3 },
    { "date": "2026-02-12", "count": 8 },
    { "date": "2026-02-13", "count": 2 },
    { "date": "2026-02-14", "count": 10 },
    { "date": "2026-02-15", "count": 4 }
  ]
}
```

#### curl 예시

```bash
curl https://rag-project-navy.vercel.app/api/stats \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN"
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `401` | 인증 실패 |
| `500` | 서버 오류 |

---

## Export

### `GET /api/export/{id}`

특정 대화를 마크다운 파일로 다운로드합니다.

#### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | `string (uuid)` | 대화 ID |

#### Response

`200 OK` — 마크다운 텍스트 (`Content-Type: text/markdown`)

`Content-Disposition` 헤더에 파일명이 포함됩니다.

```markdown
# 문서 분석 요청

> 내보내기: 2026. 02. 15. 10:30 KST

---

**사용자**: 이 문서의 핵심 내용을 요약해 주세요.

---

**어시스턴트**: 문서의 핵심 내용은 다음과 같습니다...
```

#### curl 예시

```bash
curl https://rag-project-navy.vercel.app/api/export/550e8400-e29b-41d4-a716-446655440000 \
  -H "Cookie: sb-dtbcgvuasxkovhzqtuhz-auth-token=YOUR_SESSION_TOKEN" \
  -o conversation.md
```

#### 에러 응답

| 코드 | 설명 |
|------|------|
| `401` | 인증 실패 |
| `404` | 대화를 찾을 수 없음 |
| `500` | 서버 오류 |

---

## 에러 코드

| HTTP 코드 | 설명 |
|-----------|------|
| `400` | 잘못된 요청 — 필수 파라미터 누락 또는 유효하지 않은 값 |
| `401` | 인증 실패 — 유효한 세션 쿠키가 필요합니다 |
| `404` | 리소스를 찾을 수 없음 |
| `429` | Rate limit 초과 — `Retry-After` 헤더 참조 |
| `500` | 서버 내부 오류 |

에러 응답 형식 (JSON 엔드포인트):

```json
{
  "error": "에러 메시지"
}
```
