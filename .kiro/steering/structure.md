# Project Structure

## Directory Layout

```
tuberank/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (dashboard)/       # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── kanban/           # Kanban-specific
├── lib/                   # Utilities and services
│   ├── services/         # Business logic
│   ├── supabase/         # Database client
│   └── utils/            # Helpers
├── tests/                 # Test files
├── .kiro/                 # Orchestrator config
│   ├── agents/           # Agent definitions
│   ├── prompts/          # Reusable prompts
│   ├── steering/         # Project context
│   ├── scripts/          # Validation scripts
│   └── workflows/        # Execution scripts
└── PROGRESS.md           # Status tracking
```

## Key Patterns

- API routes in `app/api/[resource]/route.ts`
- Components follow `components/[domain]/[Component].tsx`
- Services in `lib/services/[service].ts`
- Tests mirror source structure in `tests/`
