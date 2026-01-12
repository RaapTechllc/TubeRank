# TubeRank MVP Completion - Ralph Loop Story Blocks

**Created:** 2026-01-11
**Project Status:** 60% Complete
**Estimated Remaining Work:** 40-60 hours

This document contains self-contained story blocks that can be executed via Ralph Loop to complete the TubeRank MVP. Each story includes clear objectives, acceptance criteria, and implementation guidance.

---

## Story Block Index

### Phase 2: AI-Powered Features (Critical Path)
1. [STORY-01: Vitest Setup & Configuration](#story-01-vitest-setup--configuration)
2. [STORY-02: Transcript Fetching Service](#story-02-transcript-fetching-service)
3. [STORY-03: OpenRouter LLM Client](#story-03-openrouter-llm-client)
4. [STORY-04: Summarization Pipeline - Extract Pass](#story-04-summarization-pipeline---extract-pass)
5. [STORY-05: Summarization Pipeline - Verify Pass](#story-05-summarization-pipeline---verify-pass)
6. [STORY-06: Gemini Embeddings Client](#story-06-gemini-embeddings-client)
7. [STORY-07: 5-Dimension Scoring Engine](#story-07-5-dimension-scoring-engine)
8. [STORY-08: Job Handlers for AI Pipeline](#story-08-job-handlers-for-ai-pipeline)

### Phase 3: Export & Polish
9. [STORY-09: Obsidian Export](#story-09-obsidian-export)
10. [STORY-10: Manual Video Addition UI](#story-10-manual-video-addition-ui)

### Phase 4: Quality & Testing
11. [STORY-11: Unit Tests for Core Services](#story-11-unit-tests-for-core-services)
12. [STORY-12: Integration Tests for API Routes](#story-12-integration-tests-for-api-routes)

---

## Story Blocks

---

### STORY-01: Vitest Setup & Configuration

**Priority:** HIGH (Unblocks all testing)
**Estimated Effort:** 2-3 hours
**Dependencies:** None

#### Objective
Configure Vitest test framework so all existing test files can execute. Currently test files exist but framework is not set up.

#### Acceptance Criteria
- [ ] `pnpm test` runs all tests successfully
- [ ] `pnpm test:ui` opens Vitest UI
- [ ] `pnpm test:coverage` generates coverage report
- [ ] Existing test files in `tests/` directory execute
- [ ] React component tests work with jsdom
- [ ] Path aliases (`@/`) resolve correctly in tests

#### Implementation Steps

1. **Install missing dependencies:**
   ```bash
   pnpm add -D @vitest/ui @testing-library/jest-dom jsdom @vitejs/plugin-react
   ```

2. **Create `vitest.config.ts` in project root:**
   ```typescript
   import { defineConfig } from 'vitest/config'
   import react from '@vitejs/plugin-react'
   import path from 'path'

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./tests/setup.ts'],
       include: ['tests/**/*.test.{ts,tsx}'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'json', 'html'],
         exclude: [
           'node_modules/',
           'tests/',
           '**/*.d.ts',
           '**/*.config.*'
         ]
       }
     },
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './')
       }
     }
   })
   ```

3. **Create `tests/setup.ts`:**
   ```typescript
   import '@testing-library/jest-dom'
   import { vi } from 'vitest'

   // Mock Supabase client
   vi.mock('@/lib/supabase/server', () => ({
     createServerClient: vi.fn(() => ({
       from: vi.fn(() => ({
         select: vi.fn().mockReturnThis(),
         insert: vi.fn().mockReturnThis(),
         update: vi.fn().mockReturnThis(),
         delete: vi.fn().mockReturnThis(),
         eq: vi.fn().mockReturnThis(),
         single: vi.fn().mockResolvedValue({ data: null, error: null })
       }))
     }))
   }))

   // Mock environment
   vi.mock('@/lib/config/env', () => ({
     getEnv: vi.fn(() => ({
       NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
       NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
       CRON_SECRET: 'a'.repeat(32)
     }))
   }))
   ```

4. **Update `package.json` scripts:**
   ```json
   {
     "scripts": {
       "test": "vitest",
       "test:ui": "vitest --ui",
       "test:coverage": "vitest run --coverage"
     }
   }
   ```

5. **Update `tsconfig.json` to include vitest types:**
   ```json
   {
     "compilerOptions": {
       "types": ["vitest/globals", "@testing-library/jest-dom"]
     }
   }
   ```

6. **Run tests to verify:**
   ```bash
   pnpm test
   ```

#### Files to Create/Modify
- `vitest.config.ts` (create)
- `tests/setup.ts` (create/update)
- `package.json` (modify scripts)
- `tsconfig.json` (add types)

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test runs with 0 failures" Complete Vitest setup and configuration
```

---

### STORY-02: Transcript Fetching Service

**Priority:** HIGH (Critical path blocker)
**Estimated Effort:** 5-8 hours
**Dependencies:** STORY-01

#### Objective
Implement a service to fetch YouTube video transcripts. Support multiple sources: YouTube's official captions API and fallback to third-party services.

#### Acceptance Criteria
- [ ] Can fetch transcript for any video with available captions
- [ ] Stores transcript in `transcripts` table with status tracking
- [ ] Handles missing transcripts gracefully (status: 'none')
- [ ] Supports multiple languages with fallback to English
- [ ] Unit tests cover success, failure, and edge cases
- [ ] Tracks language and confidence score

#### Implementation Steps

1. **Create transcript types (`lib/transcripts/types.ts`):**
   ```typescript
   export interface TranscriptSegment {
     text: string
     start: number
     duration: number
   }

   export interface TranscriptResult {
     videoId: string
     language: string
     content: string
     segments?: TranscriptSegment[]
     source: 'official' | 'fetcher' | 'user' | 'asr'
     confidence: number
   }

   export interface TranscriptFetchOptions {
     preferredLanguage?: string
     includeTimestamps?: boolean
   }
   ```

2. **Create YouTube transcript fetcher (`lib/transcripts/youtube-fetcher.ts`):**
   - Use `youtube-transcript` package or YouTube Data API
   - Implement language detection and fallback
   - Parse caption tracks from video page or API

3. **Create transcript service (`lib/transcripts/service.ts`):**
   ```typescript
   export async function fetchAndStoreTranscript(
     videoId: string,
     options?: TranscriptFetchOptions
   ): Promise<TranscriptResult | null>

   export async function getTranscript(videoId: string): Promise<Transcript | null>

   export async function updateTranscriptStatus(
     videoId: string,
     status: 'pending' | 'available' | 'failed' | 'none'
   ): Promise<void>
   ```

4. **Add dependency:**
   ```bash
   pnpm add youtube-transcript
   ```

5. **Write unit tests (`tests/unit/transcripts.test.ts`):**
   - Test successful fetch
   - Test missing captions
   - Test language fallback
   - Test error handling

#### Files to Create
- `lib/transcripts/types.ts`
- `lib/transcripts/youtube-fetcher.ts`
- `lib/transcripts/service.ts`
- `lib/transcripts/index.ts`
- `tests/unit/transcripts.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/transcripts.test.ts passes" Implement transcript fetching service
```

---

### STORY-03: OpenRouter LLM Client

**Priority:** HIGH (Critical path blocker)
**Estimated Effort:** 6-10 hours
**Dependencies:** STORY-01

#### Objective
Create a robust OpenRouter API client for LLM completions. Support JSON mode, streaming, and proper error handling with retry logic.

#### Acceptance Criteria
- [ ] Can call OpenRouter completions API with any supported model
- [ ] Handles JSON response format (strips markdown code blocks)
- [ ] Implements exponential backoff retry on rate limits
- [ ] Tracks token usage for cost monitoring
- [ ] Supports both streaming and non-streaming modes
- [ ] Unit tests mock API responses
- [ ] Stores usage in `quota_usage` table

#### Implementation Steps

1. **Create LLM types (`lib/llm/types.ts`):**
   ```typescript
   export interface CompletionMessage {
     role: 'system' | 'user' | 'assistant'
     content: string
   }

   export interface CompletionOptions {
     model: string
     messages: CompletionMessage[]
     temperature?: number
     max_tokens?: number
     response_format?: { type: 'json_object' }
     stream?: boolean
   }

   export interface CompletionResponse {
     content: string
     usage: {
       prompt_tokens: number
       completion_tokens: number
       total_tokens: number
     }
     model: string
     finish_reason: string
   }

   export interface LLMError extends Error {
     status?: number
     retryAfter?: number
   }
   ```

2. **Create OpenRouter client (`lib/llm/client.ts`):**
   ```typescript
   const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

   export async function complete(options: CompletionOptions): Promise<CompletionResponse>
   export async function parseJSONResponse<T>(content: string): Promise<T>
   export function extractJSONFromMarkdown(content: string): string
   ```

3. **Create model configuration (`lib/llm/models.ts`):**
   ```typescript
   export const MODELS = {
     EXTRACTION: 'google/gemini-3-flash-preview',
     VERIFICATION: 'google/gemini-2.5-flash-lite',
     EMBEDDING: 'google/gemini-embedding-001'
   } as const

   export const MODEL_COSTS = {
     'google/gemini-3-flash-preview': { input: 0.50, output: 3.00 },
     'google/gemini-2.5-flash-lite': { input: 0.10, output: 0.40 }
   }
   ```

4. **Create usage tracking (`lib/llm/usage.ts`):**
   ```typescript
   export async function trackUsage(
     provider: 'openrouter' | 'google-ai',
     tokens: number,
     cost: number
   ): Promise<void>
   ```

5. **Write unit tests (`tests/unit/llm-client.test.ts`):**
   - Test successful completion
   - Test JSON parsing with markdown blocks
   - Test retry on 429
   - Test usage tracking

#### Environment Variable Required
```bash
OPENROUTER_API_KEY=your-api-key
```

#### Files to Create
- `lib/llm/types.ts`
- `lib/llm/client.ts`
- `lib/llm/models.ts`
- `lib/llm/usage.ts`
- `lib/llm/index.ts`
- `tests/unit/llm-client.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/llm-client.test.ts passes" Implement OpenRouter LLM client
```

---

### STORY-04: Summarization Pipeline - Extract Pass

**Priority:** HIGH
**Estimated Effort:** 8-10 hours
**Dependencies:** STORY-02, STORY-03

#### Objective
Implement Pass 1 of the 2-pass summarization pipeline. Extract key information from video transcripts: key ideas, action items, claims, entities, and tags.

#### Acceptance Criteria
- [ ] Extracts 5-10 key ideas with importance scores
- [ ] Extracts action items with priority levels
- [ ] Identifies claims that need verification
- [ ] Extracts named entities (people, products, companies)
- [ ] Generates relevant tags (5-10)
- [ ] Produces short (2-3 sentence) and long (paragraph) summaries
- [ ] Uses profile's system_prompt for context
- [ ] Handles long transcripts (chunking if needed)
- [ ] Unit tests with mocked LLM responses

#### Implementation Steps

1. **Create extraction prompts (`lib/summarize/prompts.ts`):**
   ```typescript
   export function buildExtractionPrompt(
     transcript: string,
     profileContext?: string
   ): string

   export const EXTRACTION_SCHEMA = {
     type: 'object',
     properties: {
       key_ideas: { type: 'array', items: { ... } },
       action_items: { type: 'array', items: { ... } },
       claims_to_verify: { type: 'array', items: { ... } },
       entities: { type: 'object' },
       tags: { type: 'array', items: { type: 'string' } },
       short_summary: { type: 'string' },
       long_summary: { type: 'string' }
     }
   }
   ```

2. **Create extraction service (`lib/summarize/extract.ts`):**
   ```typescript
   export interface ExtractionResult {
     key_ideas: Array<{ idea: string; importance: number }>
     action_items: Array<{ item: string; priority: 'high' | 'medium' | 'low' }>
     claims_to_verify: Array<{ claim: string; context: string }>
     entities: Record<string, string[]>
     tags: string[]
     short_summary: string
     long_summary: string
     tokens_used: number
   }

   export async function extractFromTranscript(
     transcript: string,
     profileContext?: string
   ): Promise<ExtractionResult>
   ```

3. **Handle long transcripts (`lib/summarize/chunker.ts`):**
   - Split transcript into overlapping chunks (~4000 tokens each)
   - Process chunks in parallel
   - Merge results with deduplication

4. **Write unit tests (`tests/unit/summarize-extract.test.ts`)**

#### Files to Create
- `lib/summarize/prompts.ts`
- `lib/summarize/extract.ts`
- `lib/summarize/chunker.ts`
- `tests/unit/summarize-extract.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/summarize-extract.test.ts passes" Implement summarization extraction pass
```

---

### STORY-05: Summarization Pipeline - Verify Pass

**Priority:** HIGH
**Estimated Effort:** 5-7 hours
**Dependencies:** STORY-04

#### Objective
Implement Pass 2 of the summarization pipeline. Cross-reference extracted claims with LLM knowledge to verify accuracy and add confidence scores.

#### Acceptance Criteria
- [ ] Reviews each claim from extraction pass
- [ ] Adds verification status: verified, disputed, unverifiable
- [ ] Adds confidence score (0-100) for each claim
- [ ] Provides reasoning for verification decision
- [ ] Uses cheaper model for cost efficiency
- [ ] Combines extraction + verification into final summary
- [ ] Stores in `summaries` table
- [ ] Unit tests with mocked responses

#### Implementation Steps

1. **Create verification prompts (`lib/summarize/verify-prompts.ts`):**
   ```typescript
   export function buildVerificationPrompt(claims: Claim[]): string

   export const VERIFICATION_SCHEMA = {
     type: 'object',
     properties: {
       claims: {
         type: 'array',
         items: {
           claim: { type: 'string' },
           status: { enum: ['verified', 'disputed', 'unverifiable'] },
           confidence: { type: 'number', min: 0, max: 100 },
           reasoning: { type: 'string' }
         }
       }
     }
   }
   ```

2. **Create verification service (`lib/summarize/verify.ts`):**
   ```typescript
   export interface VerifiedClaim {
     claim: string
     status: 'verified' | 'disputed' | 'unverifiable'
     confidence: number
     reasoning: string
     context?: string
   }

   export async function verifyClaims(
     claims: Array<{ claim: string; context: string }>
   ): Promise<VerifiedClaim[]>
   ```

3. **Create orchestrator (`lib/summarize/index.ts`):**
   ```typescript
   export async function summarizeVideo(
     videoId: string,
     profileId: string
   ): Promise<Summary>
   ```

4. **Write unit tests (`tests/unit/summarize-verify.test.ts`)**

#### Files to Create
- `lib/summarize/verify-prompts.ts`
- `lib/summarize/verify.ts`
- `lib/summarize/index.ts`
- `tests/unit/summarize-verify.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/summarize-verify.test.ts passes" Implement summarization verification pass
```

---

### STORY-06: Gemini Embeddings Client

**Priority:** HIGH
**Estimated Effort:** 4-6 hours
**Dependencies:** STORY-01

#### Objective
Create a client for Google's Gemini Embedding API to generate 768-dimensional vectors for semantic similarity calculations. Store embeddings in pgvector format.

#### Acceptance Criteria
- [ ] Generates 768-dimensional embeddings from text
- [ ] Stores embeddings in `embeddings` table with pgvector
- [ ] Calculates cosine similarity between embeddings
- [ ] Supports batch embedding generation
- [ ] Tracks API usage in `quota_usage`
- [ ] Unit tests with mocked API responses

#### Implementation Steps

1. **Create embedding types (`lib/embeddings/types.ts`):**
   ```typescript
   export interface EmbeddingResult {
     embedding: number[]
     dimension: number
   }

   export interface SimilarityResult {
     videoId: string
     score: number
   }
   ```

2. **Create Gemini embedding client (`lib/embeddings/client.ts`):**
   ```typescript
   const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent'

   export async function generateEmbedding(text: string): Promise<number[]>
   export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]>
   ```

3. **Create similarity service (`lib/embeddings/similarity.ts`):**
   ```typescript
   export async function findSimilar(
     embedding: number[],
     limit?: number
   ): Promise<SimilarityResult[]>

   export function cosineSimilarity(a: number[], b: number[]): number

   export async function calculateNoveltyScore(
     embedding: number[],
     profileId: string
   ): Promise<number>
   ```

4. **Create storage service (`lib/embeddings/storage.ts`):**
   ```typescript
   export async function storeEmbedding(
     videoId: string,
     profileId: string,
     embedding: number[],
     sourceType: 'summary'
   ): Promise<void>
   ```

5. **Write unit tests (`tests/unit/embeddings.test.ts`)**

#### Environment Variable Required
```bash
GOOGLE_AI_API_KEY=your-api-key
```

#### Files to Create
- `lib/embeddings/types.ts`
- `lib/embeddings/client.ts`
- `lib/embeddings/similarity.ts`
- `lib/embeddings/storage.ts`
- `lib/embeddings/index.ts`
- `tests/unit/embeddings.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/embeddings.test.ts passes" Implement Gemini embeddings client
```

---

### STORY-07: 5-Dimension Scoring Engine

**Priority:** HIGH
**Estimated Effort:** 8-12 hours
**Dependencies:** STORY-05, STORY-06

#### Objective
Implement the 5-dimension scoring engine that calculates relevance, novelty, actionability, credibility, and efficiency scores for each video per profile.

#### Acceptance Criteria
- [ ] Calculates 5 dimension scores (0-100 each)
- [ ] Applies profile-specific score weights
- [ ] Calculates overall weighted score
- [ ] Stores scores in `scores` table
- [ ] Provides reason codes for each dimension
- [ ] Calculates estimated time saved
- [ ] Unit tests for each dimension calculator

#### Dimension Definitions

| Dimension | Weight | Calculation |
|-----------|--------|-------------|
| Relevance | 35% | Embedding similarity to profile description |
| Novelty | 20% | 1 - max similarity to existing videos in profile |
| Actionability | 20% | Count action items + frameworks + step-by-step content |
| Credibility | 15% | Verified claims ratio + citation count |
| Efficiency | 10% | Key ideas per minute + compression ratio |

#### Implementation Steps

1. **Create scoring types (`lib/scoring/types.ts`):**
   ```typescript
   export interface DimensionScore {
     score: number
     reasons: string[]
     raw_data?: Record<string, unknown>
   }

   export interface VideoScore {
     overall_score: number
     relevance: DimensionScore
     novelty: DimensionScore
     actionability: DimensionScore
     credibility: DimensionScore
     efficiency: DimensionScore
     time_saved_seconds: number
   }
   ```

2. **Create dimension calculators (`lib/scoring/dimensions.ts`):**
   ```typescript
   export async function calculateRelevance(
     summaryEmbedding: number[],
     profileId: string
   ): Promise<DimensionScore>

   export async function calculateNovelty(
     summaryEmbedding: number[],
     profileId: string
   ): Promise<DimensionScore>

   export function calculateActionability(summary: Summary): DimensionScore
   export function calculateCredibility(summary: Summary): DimensionScore
   export function calculateEfficiency(
     summary: Summary,
     videoDuration: number
   ): DimensionScore
   ```

3. **Create scoring orchestrator (`lib/scoring/index.ts`):**
   ```typescript
   export async function scoreVideo(
     videoId: string,
     profileId: string
   ): Promise<Score>
   ```

4. **Write unit tests (`tests/unit/scoring.test.ts`)**

#### Files to Create
- `lib/scoring/types.ts`
- `lib/scoring/dimensions.ts`
- `lib/scoring/index.ts`
- `tests/unit/scoring.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/scoring.test.ts passes" Implement 5-dimension scoring engine
```

---

### STORY-08: Job Handlers for AI Pipeline

**Priority:** HIGH
**Estimated Effort:** 6-8 hours
**Dependencies:** STORY-02 through STORY-07

#### Objective
Create job handlers that chain the AI pipeline: fetch-transcript → summarize-video → score-video → generate-embedding. Each job should trigger the next in the chain.

#### Acceptance Criteria
- [ ] `fetch-transcript` job handler fetches and stores transcript
- [ ] `summarize-video` job handler runs 2-pass summarization
- [ ] `score-video` job handler calculates 5 dimension scores
- [ ] `generate-embedding` job handler creates and stores embedding
- [ ] Each job queues the next job on success
- [ ] Failed jobs create alerts after max retries
- [ ] Job runs tracked in `job_runs` table
- [ ] Integration tests verify full pipeline

#### Implementation Steps

1. **Update job types (`lib/jobs/queue.ts`):**
   ```typescript
   export type JobType =
     | 'rss_fetch_channel'
     | 'keyword_search'
     | 'category_fetch'
     | 'daily_digest'
     | 'fetch_transcript'
     | 'summarize_video'
     | 'score_video'
     | 'generate_embedding'
   ```

2. **Create fetch-transcript handler (`app/api/jobs/fetch-transcript/route.ts`):**
   - Fetch transcript for video
   - Store in database
   - Queue summarize-video job

3. **Create summarize-video handler (`app/api/jobs/summarize-video/route.ts`):**
   - Run 2-pass summarization
   - Store summary
   - Queue score-video job

4. **Create score-video handler (`app/api/jobs/score-video/route.ts`):**
   - Calculate 5 dimension scores
   - Store scores
   - Queue generate-embedding job

5. **Create generate-embedding handler (`app/api/jobs/generate-embedding/route.ts`):**
   - Generate embedding from summary
   - Store in pgvector
   - Update video card if score meets threshold

6. **Create cron endpoint for processing (`app/api/cron/process-ai-jobs/route.ts`):**
   - Process all AI job types in priority order
   - Batch processing with timeout safety

7. **Write integration tests (`tests/integration/ai-pipeline.test.ts`)**

#### Files to Create
- `app/api/jobs/fetch-transcript/route.ts`
- `app/api/jobs/summarize-video/route.ts`
- `app/api/jobs/score-video/route.ts`
- `app/api/jobs/generate-embedding/route.ts`
- `app/api/cron/process-ai-jobs/route.ts`
- `tests/integration/ai-pipeline.test.ts`

#### Files to Modify
- `lib/jobs/queue.ts` (add new job types)

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/integration/ai-pipeline.test.ts passes" Implement AI pipeline job handlers
```

---

### STORY-09: Obsidian Export

**Priority:** MEDIUM
**Estimated Effort:** 8-10 hours
**Dependencies:** STORY-07

#### Objective
Implement export functionality to generate Obsidian-compatible markdown files with YAML frontmatter. Support single video and bulk export as ZIP.

#### Acceptance Criteria
- [ ] Single video exports as `.md` file
- [ ] Bulk export creates `.zip` with folder structure
- [ ] YAML frontmatter includes all metadata
- [ ] Content includes key ideas, claims, action items
- [ ] Filename sanitization handles special characters
- [ ] Channel names link to channel pages
- [ ] Wikilinks for tags (`[[tag]]`)
- [ ] Exports tracked in `exports` table

#### Markdown Format
```markdown
---
video_id: "abc123"
youtube_url: "https://youtube.com/watch?v=abc123"
channel: "[[Tech Channel]]"
title: "Video Title"
published: 2026-01-11
overall_score: 85
tags:
  - "[[technology]]"
  - "[[programming]]"
---

# Video Title

> [!info] Video Info
> **Channel:** [[Tech Channel]]
> **Duration:** 15:30 | **Score:** 85/100 | **Time Saved:** 12 min
> [Watch on YouTube](https://youtube.com/watch?v=abc123)

## Key Ideas
1. **First key idea** - Context for the idea

## Claims to Verify
| Claim | Status | Confidence |
|-------|--------|------------|
| Claim text | Verified | 85% |

## Action Items
- [ ] First action item
- [ ] Second action item

## Summary
Long summary text here...

---
*Exported from TubeRank on 2026-01-11*
```

#### Implementation Steps

1. **Install jszip:**
   ```bash
   pnpm add jszip
   pnpm add -D @types/jszip
   ```

2. **Create filename sanitizer (`lib/export/filename.ts`):**
   ```typescript
   export function sanitizeFilename(title: string): string
   export function generateFilename(video: Video): string
   ```

3. **Create markdown generator (`lib/export/obsidian.ts`):**
   ```typescript
   export function generateObsidianMarkdown(
     video: Video,
     summary: Summary,
     score: Score
   ): string
   ```

4. **Create export API (`app/api/exports/route.ts`):**
   - POST: Create export job
   - GET with `?type=single&videoId=X`: Download single
   - GET with `?type=bulk&profileId=X`: Download ZIP

5. **Create export button component (`components/export/export-button.tsx`)**

6. **Write unit tests (`tests/unit/export.test.ts`)**

#### Files to Create
- `lib/export/filename.ts`
- `lib/export/obsidian.ts`
- `lib/export/index.ts`
- `app/api/exports/route.ts`
- `components/export/export-button.tsx`
- `tests/unit/export.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/export.test.ts passes" Implement Obsidian export
```

---

### STORY-10: Manual Video Addition UI

**Priority:** MEDIUM
**Estimated Effort:** 4-6 hours
**Dependencies:** None

#### Objective
Create UI for manually adding videos to profiles (video_set type). Support single URL paste and bulk import from multiple URLs.

#### Acceptance Criteria
- [ ] Single video URL input with validation
- [ ] Bulk import textarea (one URL per line)
- [ ] Extracts video ID from various YouTube URL formats
- [ ] Fetches video metadata from YouTube oEmbed API
- [ ] Creates video record and card in inbox
- [ ] Shows progress for bulk imports
- [ ] Error feedback for invalid URLs

#### URL Formats to Support
- `https://youtube.com/watch?v=abc123`
- `https://youtu.be/abc123`
- `https://www.youtube.com/embed/abc123`
- `https://youtube.com/shorts/abc123`

#### Implementation Steps

1. **Create URL parser (`lib/youtube/url-parser.ts`):**
   ```typescript
   export function extractVideoId(url: string): string | null
   export function isValidYouTubeUrl(url: string): boolean
   ```

2. **Create oEmbed fetcher (`lib/youtube/oembed.ts`):**
   ```typescript
   export async function fetchVideoMetadata(videoId: string): Promise<{
     title: string
     channel: string
     thumbnail: string
   }>
   ```

3. **Create manual add API (`app/api/profiles/[id]/videos/route.ts`):**
   - POST: Add single or multiple videos
   - Validate URLs, fetch metadata, create records

4. **Create add video component (`components/profiles/add-video-form.tsx`):**
   - Tab interface: Single / Bulk
   - URL validation with feedback
   - Submit with loading state

5. **Write unit tests (`tests/unit/youtube-url.test.ts`)**

#### Files to Create
- `lib/youtube/url-parser.ts`
- `lib/youtube/oembed.ts`
- `app/api/profiles/[id]/videos/route.ts`
- `components/profiles/add-video-form.tsx`
- `tests/unit/youtube-url.test.ts`

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/unit/youtube-url.test.ts passes" Implement manual video addition UI
```

---

### STORY-11: Unit Tests for Core Services

**Priority:** MEDIUM
**Estimated Effort:** 8-10 hours
**Dependencies:** STORY-01

#### Objective
Write comprehensive unit tests for all core services to achieve >70% coverage on business logic.

#### Test Coverage Targets

| Module | Target | Priority |
|--------|--------|----------|
| lib/jobs/queue.ts | 80% | High |
| lib/rss/youtube-parser.ts | 90% | High |
| lib/rss/process-channel-job.ts | 80% | High |
| lib/rate-limit/limiter.ts | 80% | Medium |
| lib/utils/auth.ts | 100% | High |
| lib/stores/board-store.ts | 70% | Medium |

#### Implementation Steps

1. **Create test files for each module:**
   - `tests/unit/queue.test.ts`
   - `tests/unit/youtube-parser.test.ts`
   - `tests/unit/process-channel-job.test.ts`
   - `tests/unit/rate-limiter.test.ts`
   - `tests/unit/auth.test.ts`
   - `tests/unit/board-store.test.ts`

2. **Create mock factories (`tests/mocks/factories.ts`):**
   ```typescript
   export function createMockJob(overrides?: Partial<Job>): Job
   export function createMockVideo(overrides?: Partial<Video>): Video
   export function createMockProfile(overrides?: Partial<Profile>): Profile
   ```

3. **Create Supabase mock (`tests/mocks/supabase.ts`):**
   ```typescript
   export function createMockSupabaseClient(): MockSupabaseClient
   ```

4. **Run coverage report:**
   ```bash
   pnpm test:coverage
   ```

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test:coverage shows >70% coverage" Write unit tests for core services
```

---

### STORY-12: Integration Tests for API Routes

**Priority:** MEDIUM
**Estimated Effort:** 6-8 hours
**Dependencies:** STORY-11

#### Objective
Write integration tests for critical API routes to verify end-to-end functionality.

#### Routes to Test

| Route | Methods | Priority |
|-------|---------|----------|
| /api/profiles | GET, POST | High |
| /api/profiles/[id] | GET, PUT, DELETE | High |
| /api/cards | GET, POST | High |
| /api/cards/[id] | PUT, DELETE | High |
| /api/rss/refresh | POST | High |
| /api/cron/ingest-channels | GET | Medium |

#### Implementation Steps

1. **Create test server setup (`tests/integration/setup.ts`):**
   ```typescript
   export function createTestRequest(
     method: string,
     url: string,
     body?: unknown
   ): Request
   ```

2. **Create integration tests:**
   - `tests/integration/profiles.test.ts`
   - `tests/integration/cards.test.ts`
   - `tests/integration/rss-refresh.test.ts`
   - `tests/integration/cron.test.ts`

3. **Create test database seed (`tests/fixtures/seed.ts`):**
   ```typescript
   export async function seedTestData(): Promise<void>
   export async function cleanupTestData(): Promise<void>
   ```

#### Completion Command
```bash
/ralph-loop --completion-promise "pnpm test tests/integration passes" Write integration tests for API routes
```

---

## Execution Order

### Critical Path (Execute in Order)
1. STORY-01: Vitest Setup
2. STORY-02: Transcript Fetching
3. STORY-03: LLM Client
4. STORY-04: Extraction Pass
5. STORY-05: Verification Pass
6. STORY-06: Embeddings Client
7. STORY-07: Scoring Engine
8. STORY-08: Job Handlers

### Parallel Track (Can Run Alongside)
- STORY-09: Obsidian Export (after STORY-07)
- STORY-10: Manual Video Addition (no dependencies)
- STORY-11: Unit Tests (after STORY-01)
- STORY-12: Integration Tests (after STORY-11)

---

## Quick Reference Commands

```bash
# Run all story blocks in sequence
/ralph-loop Complete Vitest setup and configuration
/ralph-loop Implement transcript fetching service
/ralph-loop Implement OpenRouter LLM client
/ralph-loop Implement summarization extraction pass
/ralph-loop Implement summarization verification pass
/ralph-loop Implement Gemini embeddings client
/ralph-loop Implement 5-dimension scoring engine
/ralph-loop Implement AI pipeline job handlers

# Optional enhancements
/ralph-loop Implement Obsidian export
/ralph-loop Implement manual video addition UI
/ralph-loop Write unit tests for core services
/ralph-loop Write integration tests for API routes
```

---

## Success Metrics

When all stories are complete:

- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes with >70% coverage
- [ ] Videos are automatically summarized after RSS ingestion
- [ ] Scores appear on video cards in Kanban board
- [ ] Export to Obsidian works for single and bulk
- [ ] All 5 profile types are fully functional

---

*Document created: 2026-01-11*
*Last updated: 2026-01-11*
