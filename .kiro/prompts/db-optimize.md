# Database Optimization

Analyze database schema and queries for performance optimization.

## Analysis Areas

### 1. Schema Review
- [ ] Index coverage for common queries
- [ ] Appropriate data types (not oversized)
- [ ] Relationship efficiency (proper foreign keys)
- [ ] Missing constraints (unique, not null, check)
- [ ] Normalization level appropriate
- [ ] Soft deletes vs hard deletes strategy

### 2. Query Analysis
- [ ] N+1 query detection
- [ ] Unnecessary data fetching (SELECT *)
- [ ] Missing pagination on list queries
- [ ] Inefficient joins
- [ ] Subqueries that could be joins
- [ ] Missing WHERE clauses

### 3. Index Strategy
```sql
-- Check for missing indexes on foreign keys
-- Check for unused indexes
-- Check for duplicate indexes
-- Consider composite indexes for common query patterns
```

### 4. ORM Patterns

**Eager vs Lazy Loading**
```typescript
// Bad: N+1 queries
const users = await db.user.findMany()
for (const user of users) {
  const posts = await db.post.findMany({ where: { userId: user.id } })
}

// Good: Single query with join
const users = await db.user.findMany({
  include: { posts: true }
})
```

**Select Only What You Need**
```typescript
// Bad: Fetching everything
const user = await db.user.findUnique({ where: { id } })

// Good: Fetching only needed fields
const user = await db.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }
})
```

**Pagination**
```typescript
// Always paginate list queries
const users = await db.user.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
})
```

### 5. Connection Management
- [ ] Connection pooling configured
- [ ] Connection limits appropriate
- [ ] Idle connection timeout set
- [ ] Transaction timeouts configured

### 6. Caching Strategy
- [ ] Frequently accessed data cached
- [ ] Cache invalidation strategy
- [ ] Query result caching where appropriate

## Workflow

1. Review schema files (migrations, schema.prisma, etc.)
2. Scan API routes for database queries
3. Check for query patterns in hooks/services
4. Run EXPLAIN on slow queries
5. Identify optimization opportunities

## Output Format

```markdown
### Finding: [Title]

**Location**: `path/to/file.ts:42`
**Issue**: [What's inefficient]
**Impact**: [Performance cost - High/Medium/Low]
**Current Query**:
```sql
[Current query or code]
```

**Optimized**:
```sql
[Optimized query or code]
```

**Expected Improvement**: [e.g., "Reduces queries from N+1 to 1"]
```

## Quick Wins

1. **Add indexes on foreign keys** - Often missed, big impact
2. **Use select instead of include** - Fetch only needed fields
3. **Add pagination** - Prevent unbounded queries
4. **Batch operations** - Use createMany/updateMany
5. **Cache static data** - Reduce repeated queries

## Common Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| SELECT * | Fetches unnecessary data | Use select/pick |
| N+1 queries | Multiple round trips | Use include/join |
| No pagination | Unbounded results | Add take/skip |
| Missing indexes | Full table scans | Add appropriate indexes |
| Over-fetching | Too much data | Fetch only what's needed |

## Performance Testing

```bash
# Enable query logging (Prisma)
# In schema.prisma or client initialization
log: ['query', 'info', 'warn', 'error']

# Check slow queries
# Look for queries > 100ms
```
