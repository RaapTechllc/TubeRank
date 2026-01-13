# Security Audit

Perform a comprehensive security audit of the codebase.

## Audit Scope

### 1. Authentication & Authorization
- [ ] Auth bypass vulnerabilities (missing middleware, incorrect checks)
- [ ] Session management (secure cookies, expiration, rotation)
- [ ] Role-based access controls (RBAC enforcement)
- [ ] Password policies (if applicable)
- [ ] OAuth/SSO implementation (if applicable)

### 2. Injection Attacks
- [ ] SQL injection (check raw queries, even with ORMs)
- [ ] NoSQL injection (MongoDB operators in user input)
- [ ] XSS vulnerabilities (user input in HTML, dangerouslySetInnerHTML)
- [ ] Command injection (shell executions with user input)
- [ ] Path traversal (file operations with user input)

### 3. Data Exposure
- [ ] Sensitive data in logs (passwords, tokens, PII)
- [ ] API responses leaking internal data (stack traces, IDs)
- [ ] Hardcoded secrets or credentials
- [ ] Exposed .env files or config
- [ ] Source maps in production

### 4. API Security
- [ ] Rate limiting on all endpoints
- [ ] Input validation (size limits, type checking)
- [ ] CORS configuration (not wildcard in production)
- [ ] Content-Type validation
- [ ] Request size limits

### 5. Client-Side Security
- [ ] Sensitive data in localStorage/sessionStorage
- [ ] JWT stored securely (httpOnly cookies preferred)
- [ ] CSP headers configured
- [ ] No secrets in client-side code

### 6. Dependencies
- [ ] Run `npm audit` or `pnpm audit`
- [ ] Check for outdated packages with known vulnerabilities
- [ ] Review third-party package permissions

## OWASP Top 10 Quick Check
1. **A01 Broken Access Control** - Can users access others' data?
2. **A02 Cryptographic Failures** - Is sensitive data encrypted?
3. **A03 Injection** - Is user input sanitized?
4. **A04 Insecure Design** - Are there security controls in the design?
5. **A05 Security Misconfiguration** - Are defaults changed?
6. **A06 Vulnerable Components** - Are dependencies updated?
7. **A07 Auth Failures** - Is authentication robust?
8. **A08 Data Integrity Failures** - Is data validated?
9. **A09 Logging Failures** - Are security events logged?
10. **A10 SSRF** - Are external requests validated?

## Output Format

For each finding:
```markdown
### [Severity: Critical/High/Medium/Low] - [Title]

**File**: `path/to/file.ts:42`
**Issue**: [Description of the vulnerability]
**Impact**: [What could happen if exploited]
**Fix**: [Specific remediation steps]
**Reference**: [OWASP/CWE link if applicable]
```

## Quick Commands
```bash
# Check for secrets in git history
git log -p | grep -i "password\|secret\|api_key\|token"

# Audit dependencies
npm audit
pnpm audit

# Check for exposed env files
find . -name ".env*" -not -path "./node_modules/*"
```

## Scan Locations (Priority Order)
1. `app/api/` or `src/app/api/` - API routes
2. `middleware.ts` - Auth middleware
3. `lib/auth/` - Authentication logic
4. `lib/db/` or `lib/supabase/` - Database queries
5. Components with user input forms
