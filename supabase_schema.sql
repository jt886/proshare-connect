-- Enable the vector extension
create extension if not exists vector;

-- Create documents table
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text, -- Extracted text content
  file_path text, -- Path in Supabase Storage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id)
);

-- Create embeddings table (chunks)
create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  content text, -- Chunk content
  embedding vector(1536) -- OpenAI text-embedding-3-small dimensions
);

-- Create a function to search for documents
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  document_id uuid,
  similarity float
)
language plpgsql
as $$
begin
  return query;
  select
    document_embeddings.id,
    document_embeddings.content,
    document_embeddings.document_id,
    1 - (document_embeddings.embedding <=> query_embedding) as similarity
  from document_embeddings
  where 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  order by document_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
