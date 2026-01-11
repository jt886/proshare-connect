-- 1. Enable pgvector extension
-- This is required for vector similarity search
create extension if not exists vector;

-- 2. Ensure Documents & Embeddings tables exist
-- (These typically exist from initial schema, but we ensure idemptency)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  file_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  content text,
  embedding vector(1536)
);

-- 3. Update Community Messages for Vector Search
-- Add embedding column if it doesn't separate exist
do $$
begin
  if not exists (
      select 1 
      from information_schema.columns 
      where table_name = 'community_messages' 
      and column_name = 'embedding'
  ) then
      alter table public.community_messages 
      add column embedding vector(1536);
  end if;
end $$;

-- 4. Create Indexes for Fast Search
-- IVFFlat or HNSW (Hierarchical Navigable Small World) are good options.
-- HNSW is generally faster for query but slower for build.
-- We use unique names to avoid conflicts.

create index if not exists document_embeddings_embedding_idx 
on public.document_embeddings 
using hnsw (embedding vector_cosine_ops);

create index if not exists community_messages_embedding_idx 
on public.community_messages 
using hnsw (embedding vector_cosine_ops);

-- 5. Unified RPC Function
-- This function matches query embedding against BOTH Documents (knowledge base) 
-- and Community Messages (chat history) to return the most relevant context.

create or replace function match_mixed_context (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  source_type text,   -- 'document' or 'message'
  id uuid,            -- original record ID
  content text,       -- textual content
  similarity float,   -- cosine similarity score (0-1)
  created_at timestamp with time zone
)
language plpgsql
as $$
begin
  return query
  select * from (
    -- Search Documents (matching against chunks in document_embeddings)
    select 
      'document'::text as source_type,
      d.id as id,
      de.content as content,
      1 - (de.embedding <=> query_embedding) as similarity,
      d.created_at as created_at
    from document_embeddings de
    join documents d on de.document_id = d.id
    where 1 - (de.embedding <=> query_embedding) > match_threshold
    
    union all
    
    -- Search Community Messages
    select 
      'message'::text as source_type,
      m.id as id,
      m.content as content,
      1 - (m.embedding <=> query_embedding) as similarity,
      m.created_at as created_at
    from community_messages m
    where m.embedding is not null
    and 1 - (m.embedding <=> query_embedding) > match_threshold
  ) as combined_results
  order by similarity desc
  limit match_count;
end;
$$;
