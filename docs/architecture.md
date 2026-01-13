# TubeRank Architecture Documentation

## System Overview

TubeRank is a YouTube content intelligence dashboard built with Next.js 16, TypeScript, and Supabase. The system follows a layered architecture with clear separation of concerns, optimized for performance and scalability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router  │  React Components  │  Tailwind CSS    │
│  - Dashboard            │  - Kanban Board    │  - shadcn/ui     │
│  - Profile Management   │  - Video Cards     │  - Responsive    │
│  - Analytics            │  - Analytics       │  - Dark Mode     │
│  - Settings             │  - Forms           │  - Animations    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes     │  Middleware        │  External APIs   │
│  - REST Endpoints       │  - Authentication  │  - YouTube RSS   │
│  - CRUD Operations      │  - Rate Limiting   │  - OpenRouter    │
│  - Analytics            │  - Error Handling  │  - Google AI     │
│  - Cron Jobs            │  - CORS            │  - Sentry        │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  Services               │  Repositories      │  Job Processing  │
│  - Profile Service      │  - Profile Repo    │  - RSS Ingestion │
│  - Card Service         │  - Card Repo       │  - AI Processing │
│  - Analytics Service    │  - Analytics Repo  │  - Queue Manager │
│  - RSS Service          │  - Video Repo      │  - Batch Ops     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Supabase PostgreSQL   │  Performance        │  External Data   │
│  - 13 Core Tables       │  - Indexes          │  - YouTube RSS   │
│  - RLS Policies         │  - Query Optimization│ - Video Metadata │
│  - Real-time Subs      │  - Connection Pool  │  - Transcripts   │
│  - Migrations           │  - Monitoring       │  - AI Responses  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Architecture

**Framework**: Next.js 16 with App Router
- **Pages**: File-based routing in `app/(main)/`
- **Components**: Reusable UI components in `components/`
- **Styling**: Tailwind CSS with shadcn/ui design system
- **State Management**: Zustand for client state, React Query for server state

**Key Features**:
- Responsive design (mobile-first)
- Drag-and-drop Kanban board (@dnd-kit)
- Real-time updates via Supabase subscriptions
- Optimistic UI updates
- Toast notifications (sonner)

### 2. API Architecture

**Pattern**: RESTful API with Next.js API routes
- **Authentication**: Supabase Auth with JWT tokens
- **Rate Limiting**: In-memory sliding window (100 req/min)
- **Error Handling**: Consistent error responses with proper HTTP codes
- **Validation**: Zod schemas for request/response validation

**Endpoint Categories**:
```
/api/profiles/*          - Profile CRUD operations
/api/cards/*             - Video card management
/api/analytics/*         - Performance metrics
/api/rss/*              - RSS refresh triggers
/api/cron/*             - Background job endpoints
/api/settings/*         - User preferences
/api/health             - System health checks
```

### 3. Business Logic Layer

**Services Pattern**: Domain-specific business logic
- `ProfileService`: Profile management and validation
- `CardService`: Kanban board operations and batch updates
- `AnalyticsService`: Metrics calculation and aggregation
- `RSSService`: YouTube feed processing and ingestion

**Repository Pattern**: Data access abstraction
- `ProfileRepository`: Profile and source data operations
- `CardRepository`: Video card CRUD with optimizations
- `AnalyticsRepository`: Complex analytical queries
- `VideoRepository`: Video metadata management

### 4. Data Architecture

**Database**: Supabase PostgreSQL with 13 core tables

**Core Tables**:
```sql
profiles                 -- Content curation profiles
profile_sources         -- YouTube channels/keywords per profile
videos                  -- YouTube video metadata
profile_video_cards     -- Kanban board state (profile + video + column)
channels               -- YouTube channel information
transcripts            -- Video transcript data
summaries              -- AI-generated video summaries
scores                 -- Multi-dimensional video scoring
job_queue              -- Background job processing
alerts                 -- User notifications
quota_usage            -- API usage tracking
```

**Performance Optimizations**:
- 25+ strategic indexes for common query patterns
- Composite indexes for multi-column queries
- GIN indexes for JSON/array operations
- Query optimization with EXPLAIN analysis

## Data Flow

### 1. Content Ingestion Flow

```
YouTube RSS Feed → RSS Parser → Video Upsert → Profile Matching → Card Creation → UI Update
```

**Detailed Steps**:
1. **Cron Trigger**: Every 15 minutes or manual refresh
2. **RSS Fetch**: Retrieve latest videos from YouTube channel feeds
3. **Parse & Validate**: Extract video metadata and validate format
4. **Upsert Videos**: Insert new videos or update existing metadata
5. **Profile Matching**: Find profiles with matching channel sources
6. **Card Creation**: Create profile_video_cards in "inbox" column
7. **Real-time Update**: Supabase triggers UI refresh

### 2. Kanban Workflow

```
User Drag → Optimistic Update → API Call → Database Update → Confirmation
```

**Detailed Steps**:
1. **User Action**: Drag card between columns
2. **Optimistic UI**: Immediately update UI state
3. **API Request**: PATCH /api/cards/[id] with new column/position
4. **Database Update**: Update profile_video_cards table
5. **Confirmation**: Success/error feedback to user

### 3. Analytics Pipeline

```
Raw Data → Aggregation Queries → Caching → Chart Rendering → User Display
```

**Detailed Steps**:
1. **Data Collection**: Aggregate from multiple tables
2. **SQL Functions**: Use database-side calculations for performance
3. **Caching**: React Query with 5-minute stale time
4. **Chart Rendering**: Recharts with responsive design
5. **Real-time Updates**: Automatic refresh on data changes

## Security Architecture

### Authentication & Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security (RLS)**: Database-level access control
- **API Middleware**: Route-level authentication checks
- **CORS Configuration**: Restricted to allowed origins

### Security Measures
- **Rate Limiting**: Prevent API abuse (100 req/min global)
- **Input Validation**: Zod schemas on all endpoints
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Content Security Policy headers
- **Timing Attack Prevention**: Constant-time token comparison

### Error Handling
- **Sentry Integration**: Error tracking and monitoring
- **Graceful Degradation**: Fallback UI states
- **User-Friendly Messages**: No internal error exposure
- **Logging**: Structured logging for debugging

## Performance Architecture

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Webpack bundle analyzer
- **Lazy Loading**: Dynamic imports for heavy components

### Backend Optimizations
- **Database Indexes**: 25+ strategic indexes
- **Query Optimization**: N+1 query elimination
- **Batch Operations**: Bulk inserts/updates
- **Connection Pooling**: Supabase connection management

### Caching Strategy
- **Client-Side**: React Query with stale-while-revalidate
- **Database**: Query result caching
- **CDN**: Static asset caching via Vercel
- **API Response**: Conditional requests with ETags

## Deployment Architecture

### Production Environment
- **Hosting**: Vercel (serverless functions)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry + Vercel Analytics

### CI/CD Pipeline
```
Git Push → GitHub Actions → Build & Test → Deploy to Vercel → Health Check
```

**Pipeline Steps**:
1. **Code Quality**: ESLint, TypeScript, Prettier
2. **Testing**: Unit tests, integration tests, E2E tests
3. **Build**: Next.js production build
4. **Deploy**: Automatic deployment to Vercel
5. **Verification**: Health check endpoints

### Environment Management
- **Development**: Local with Supabase local development
- **Staging**: Preview deployments on Vercel
- **Production**: Main branch auto-deployment
- **Environment Variables**: Secure secret management

## Scalability Considerations

### Current Limits
- **Supabase**: 500MB database, 2GB bandwidth/month (free tier)
- **Vercel**: 100GB bandwidth, 1000 serverless invocations/day (hobby)
- **YouTube RSS**: No API quota limits (RSS-based)

### Scaling Strategies
1. **Database Scaling**: Upgrade to Supabase Pro for larger limits
2. **Caching Layer**: Add Redis for session/query caching
3. **CDN Optimization**: Implement aggressive caching policies
4. **Database Sharding**: Partition by profile_id for large datasets
5. **Microservices**: Split AI processing into separate services

### Performance Monitoring
- **Database**: Query performance monitoring
- **API**: Response time tracking
- **Frontend**: Core Web Vitals monitoring
- **Error Tracking**: Real-time error alerts

## Technology Stack

### Core Technologies
- **Frontend**: Next.js 16, React 18, TypeScript 5
- **Styling**: Tailwind CSS 3, shadcn/ui, Lucide Icons
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

### Key Libraries
- **State Management**: Zustand, React Query (TanStack Query)
- **Forms**: React Hook Form, Zod validation
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Notifications**: sonner (toast)

### Development Tools
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Vitest, Playwright, Testing Library
- **Monitoring**: Sentry
- **Version Control**: Git with conventional commits

## File Structure

```
tuberank/
├── app/                    # Next.js App Router
│   ├── (main)/            # Main application routes
│   │   ├── dashboard/     # Dashboard page
│   │   ├── profile/       # Profile management
│   │   ├── analytics/     # Analytics pages
│   │   ├── settings/      # Settings page
│   │   └── digest/        # Daily digest
│   ├── api/               # API routes
│   │   ├── profiles/      # Profile endpoints
│   │   ├── cards/         # Card management
│   │   ├── analytics/     # Analytics endpoints
│   │   ├── rss/           # RSS refresh
│   │   └── cron/          # Background jobs
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── board/            # Kanban board components
│   ├── profiles/         # Profile components
│   ├── analytics/        # Analytics components
│   └── layout/           # Layout components
├── lib/                  # Business logic and utilities
│   ├── services/         # Business logic services
│   ├── repositories/     # Data access layer
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── utils/            # Utility functions
│   ├── validations/      # Zod schemas
│   ├── supabase/         # Database client
│   ├── middleware/       # API middleware
│   └── types/            # TypeScript types
├── database/             # Database-related files
│   └── performance-indexes.sql
├── docs/                 # Documentation
├── tests/                # Test files
└── types/                # Global TypeScript types
```

## Future Architecture Considerations

### Planned Enhancements
1. **AI Integration**: OpenRouter for video summarization and scoring
2. **Real-time Features**: WebSocket connections for live updates
3. **Mobile App**: React Native app with shared business logic
4. **API Gateway**: Centralized API management and rate limiting
5. **Microservices**: Split into domain-specific services

### Technical Debt
1. **Testing Coverage**: Increase from current ~60% to 90%+
2. **Type Safety**: Eliminate remaining `any` types
3. **Performance**: Add comprehensive performance monitoring
4. **Documentation**: API documentation with OpenAPI spec
5. **Accessibility**: Full WCAG 2.1 AA compliance

---

*This architecture documentation reflects TubeRank v1.0 as of January 2026. The system is designed for evolution and can adapt to changing requirements while maintaining performance and reliability.*