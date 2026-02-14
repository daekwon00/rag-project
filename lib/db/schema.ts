/**
 * Supabase 테이블 스키마 정의
 *
 * SQL로 Supabase에 직접 실행:
 *
 * -- pgvector 확장 활성화
 * create extension if not exists vector;
 *
 * -- 리소스 테이블 (원본 문서 메타데이터)
 * create table resources (
 *   id bigserial primary key,
 *   name text not null,
 *   content text not null,
 *   chunk_count integer not null default 0,
 *   created_at timestamptz default now()
 * );
 *
 * -- 임베딩 테이블 (문서 조각 + 벡터)
 * create table embeddings (
 *   id bigserial primary key,
 *   content text not null,
 *   source text,
 *   embedding vector(1536),
 *   created_at timestamptz default now()
 * );
 *
 * -- 유사도 검색 함수
 * create or replace function match_embeddings(
 *   query_embedding vector(1536),
 *   match_threshold float default 0.5,
 *   match_count int default 5
 * )
 * returns table (
 *   id bigint,
 *   content text,
 *   source text,
 *   similarity float
 * )
 * language sql stable
 * as $$
 *   select
 *     embeddings.id,
 *     embeddings.content,
 *     embeddings.source,
 *     1 - (embeddings.embedding <=> query_embedding) as similarity
 *   from embeddings
 *   where 1 - (embeddings.embedding <=> query_embedding) > match_threshold
 *   order by (embeddings.embedding <=> query_embedding) asc
 *   limit match_count;
 * $$;
 */

export interface Resource {
  id?: number;
  name: string;
  content: string;
  chunk_count: number;
  created_at?: string;
}

export interface Embedding {
  id?: number;
  content: string;
  source: string | null;
  embedding: number[];
  created_at?: string;
}

export interface MatchResult {
  id: number;
  content: string;
  source: string | null;
  similarity: number;
}

/**
 * 대화/메시지 테이블 스키마
 *
 * Supabase SQL Editor에서 실행:
 *
 * -- 대화 테이블
 * CREATE TABLE conversations (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
 *   title text DEFAULT '새 대화',
 *   created_at timestamptz DEFAULT now(),
 *   updated_at timestamptz DEFAULT now()
 * );
 *
 * -- 메시지 테이블
 * CREATE TABLE messages (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
 *   role text NOT NULL CHECK (role IN ('user', 'assistant')),
 *   content text NOT NULL,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- RLS 정책
 * ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "Users can CRUD own conversations"
 *   ON conversations FOR ALL
 *   USING (auth.uid() = user_id);
 *
 * CREATE POLICY "Users can CRUD own messages"
 *   ON messages FOR ALL
 *   USING (
 *     conversation_id IN (
 *       SELECT id FROM conversations WHERE user_id = auth.uid()
 *     )
 *   );
 *
 * -- 인덱스
 * CREATE INDEX idx_conversations_user ON conversations(user_id, updated_at DESC);
 * CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
 */

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
