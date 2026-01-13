# TubeRank Technical Notes

Project-specific technical patterns and gotchas discovered during development.

---

## Framework Version Notes

### Next.js 16+

Route params are now async and must be awaited:

```typescript
// Old (Next.js 14)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id
}

// New (Next.js 16+)
type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const { id } = await params
}
```

### Zod 4+

`z.record()` requires explicit key type:

```typescript
// Zod 3 (old)
z.record(z.unknown())

// Zod 4+ (current)
z.record(z.string(), z.unknown())
```

---

## API Route Patterns

### Standard Error Handling

All API routes should include:

1. **UUID validation** for `[id]` parameters
2. **Try-catch** around `request.json()`
3. **Appropriate status codes** (400, 404, 500)

```typescript
import { isValidUUID } from '@/lib/utils/validation'

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params
  
  // 1. Validate UUID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }
  
  // 2. Parse JSON safely
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  
  // 3. Validate with Zod
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  
  // ... implementation
}
```

---

## Environment Notes

### WSL + Windows Node.js

When running in WSL with Node.js installed on Windows:

```bash
# Direct pnpm won't work
pnpm dev  # ❌ command not found

# Use PowerShell wrapper
powershell.exe -Command "cd 'E:\path\to\project'; pnpm dev"  # ✅
```

---

## Drag-and-Drop Pattern (@dnd-kit)

```
DndContext (board level)
├── KanbanColumn (useDroppable)
│   └── SortableContext
│       └── VideoCard (useSortable)
```

- `useSortable` for draggable items
- `useDroppable` for drop targets
- `closestCorners` collision detection for Kanban
- Zustand store for optimistic state updates
