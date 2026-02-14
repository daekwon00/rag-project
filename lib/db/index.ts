import { createClient } from "@supabase/supabase-js";
import type { MatchResult } from "./schema";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  async insertResource(resource: {
    name: string;
    content: string;
    chunkCount: number;
  }) {
    const { error } = await supabase.from("resources").insert({
      name: resource.name,
      content: resource.content,
      chunk_count: resource.chunkCount,
    });
    if (error) throw error;
  },

  async insertEmbeddings(
    items: { content: string; embedding: number[]; source: string }[]
  ) {
    const { error } = await supabase.from("embeddings").insert(
      items.map((item) => ({
        content: item.content,
        embedding: JSON.stringify(item.embedding),
        source: item.source,
      }))
    );
    if (error) throw error;
  },

  async searchEmbeddings(
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<MatchResult[]> {
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.2,
      match_count: limit,
    });
    if (error) throw error;
    return data ?? [];
  },
};
