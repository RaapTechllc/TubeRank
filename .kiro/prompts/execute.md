# Execute

Take implementation plans and execute them efficiently.

## Execution Approach

1. **Plan Review**: Understand the task requirements fully before coding
2. **File Analysis**: Check existing code structure and patterns
3. **Implementation**: Write minimal, focused code
4. **Testing**: Add necessary test coverage
5. **Integration**: Ensure everything works together
6. **Validation**: Run checks before marking complete

## Code Standards

### TypeScript
- Strict mode, proper typing
- No `any` without justification
- Use Zod for runtime validation at boundaries

### Components
- Functional components with hooks
- Props interface defined and exported
- Loading and error states handled

### Styling
- Tailwind classes only
- Use `cn()` utility for conditional classes
- Mobile-first responsive design

### Database
- Use project's ORM/database client
- Validate inputs before queries
- Handle errors gracefully

### API
- Follow project's API patterns
- Consistent error response format
- Input validation with Zod
- Proper HTTP status codes

### Testing
- Unit tests for business logic
- E2E tests for critical user flows
- Test error cases, not just happy path

## Implementation Priorities

1. **Functionality First**: Make it work correctly
2. **Error Handling**: Handle failures gracefully
3. **User Experience**: Make it intuitive
4. **Mobile Responsive**: Make it work everywhere
5. **Performance**: Keep it fast
6. **Testing**: Make it reliable

## Quality Checks

Before marking task complete:
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Components are responsive
- [ ] Error handling implemented

Ask: "What implementation task should I execute?"
