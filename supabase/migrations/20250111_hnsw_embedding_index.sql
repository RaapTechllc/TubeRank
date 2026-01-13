-- Migration: Upgrade embedding index from IVF-flat to HNSW for better performance
-- HNSW provides better recall and faster queries than IVF-flat for our use case

-- Drop existing IVF-flat index
DROP INDEX IF EXISTS idx_embeddings_vector;

-- Create HNSW index with optimized parameters for 768-dim vectors
-- m=16: connections per element (16 is good balance of speed/recall)
-- ef_construction=64: quality of index (higher = better recall, slower build)
CREATE INDEX idx_embeddings_vector_hnsw 
  ON embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Add helpful comment
COMMENT ON INDEX idx_embeddings_vector_hnsw IS 
  'HNSW index for fast approximate nearest neighbor search on video embeddings';
