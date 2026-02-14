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
