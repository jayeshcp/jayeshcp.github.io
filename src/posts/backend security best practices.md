---
tags: post
title: "Backend API Security Best Practices: A Developer's Field Guide"
layout: layouts/blog_layout.njk
---

APIs are the nervous system of modern software. They connect your frontend to your backend, your services to each other, and your platform to the outside world. They're also one of the most targeted attack surfaces in existence.

In 2025, the OWASP API Security Top 10 remained the go-to reference for API vulnerabilities — and the same categories keep appearing in breach reports year after year. Not because developers are careless, but because API security is genuinely nuanced and easy to get wrong under shipping pressure.

This guide is a practical, opinionated reference for building APIs that are secure by default — not bolted on as an afterthought.

---

## 1. Authentication: Know Who's Calling

Authentication is the first line of defense. If you can't verify who's making a request, nothing else matters.

### Use industry-standard tokens

**JWT (JSON Web Tokens)** are widely used but frequently misconfigured. Follow these rules without exception:

- Always verify the signature. Never accept `alg: none`.
- Use short expiry times (15–60 minutes for access tokens).
- Store refresh tokens securely — `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- Validate the `iss`, `aud`, and `exp` claims on every request.

**OAuth 2.0 + OIDC** is the right choice for delegated authorization. Don't roll your own OAuth flows — use a battle-tested provider (Auth0, Keycloak, Okta, Supabase Auth).

### API Keys for machine-to-machine

For server-to-server communication:

```
# Good: scoped, hashed, rotatable
API-Key: sk_live_abc123...

# Bad: long-lived, unscoped, stored in plaintext
```

- Hash API keys before storing them (treat them like passwords).
- Scope keys to minimum required permissions.
- Build rotation and revocation into your platform from day one.
- Never log API keys — even partially.

---

## 2. Authorization: Know What They're Allowed to Do

Authentication tells you _who_ someone is. Authorization tells you _what they can do_. Confusing the two is the source of countless security vulnerabilities.

### Implement proper access control models

**RBAC (Role-Based Access Control)** assigns permissions to roles, and roles to users. Good for most applications.

**ABAC (Attribute-Based Access Control)** makes decisions based on attributes of the user, resource, and environment. More flexible for complex permission models.

### The OWASP #1 vulnerability: Broken Object Level Authorization (BOLA)

This is the most common API vulnerability in the wild. It looks like this:

```
GET /api/invoices/1042   ← User A's invoice
GET /api/invoices/1043   ← User B's invoice — can User A access this?
```

**Always check ownership, not just authentication:**

```javascript
// ❌ Wrong — only checks if user is logged in
app.get("/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  res.json(invoice);
});

// ✅ Correct — checks ownership too
app.get("/invoices/:id", authenticate, async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    userId: req.user.id, // scope to the requesting user
  });
  if (!invoice) return res.status(404).json({ error: "Not found" });
  res.json(invoice);
});
```

### Principle of Least Privilege

Every user, service, and API key should have the minimum permissions required to do its job — nothing more. Audit your permission grants regularly and prune what's no longer needed.

---

## 3. Input Validation: Trust Nothing

Every piece of data that enters your API from the outside world is potentially hostile. Validate everything, sanitize where appropriate, and never trust client-supplied data.

### Validate at the boundary

Use a schema validation library and define your contracts explicitly:

```javascript
// Using Zod (TypeScript)
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  age: z.number().int().min(13).max(120),
  role: z.enum(["user", "admin"]).default("user"),
});

app.post("/users", (req, res) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  // result.data is now type-safe and validated
});
```

### Prevent injection attacks

**SQL Injection** — always use parameterized queries or an ORM:

```sql
-- ❌ Never do this
SELECT * FROM users WHERE email = '${userInput}';

-- ✅ Parameterized query
SELECT * FROM users WHERE email = $1;  -- pass userInput as parameter
```

**NoSQL Injection** — sanitize MongoDB operators:

```javascript
// ❌ Vulnerable
User.findOne({ email: req.body.email }); // attacker sends { "$gt": "" }

// ✅ Validate type first
const email = z.string().email().parse(req.body.email);
User.findOne({ email });
```

**Command Injection** — avoid `exec()`, `eval()`, and shell commands with user input entirely.

---

## 4. Sensitive Data Exposure: Protect What Matters

Your API should never accidentally leak more information than necessary.

### Never expose internal details in error messages

```json
// ❌ Leaks database structure, stack traces, internal paths
{
  "error": "PostgreSQL error: column 'password_hash' of relation 'users' does not exist",
  "stack": "at /app/src/db/userRepository.js:42:..."
}

// ✅ Generic error for clients, full detail in server logs only
{
  "error": "An unexpected error occurred.",
  "requestId": "req_7f3a9b2c"
}
```

### Strip sensitive fields from responses

Use explicit field selection or a serialization layer:

```javascript
// ❌ Returning the entire DB object
res.json(user);

// ✅ Explicitly select what to expose
res.json({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  // password_hash, mfaSecret, internalFlags — never returned
});
```

### Encrypt sensitive data at rest and in transit

- **TLS everywhere** — no HTTP, no exceptions. Use TLS 1.2 minimum, prefer TLS 1.3.
- **Encrypt PII and secrets at rest** using AES-256.
- **Hash passwords** with bcrypt, scrypt, or Argon2. Never MD5 or SHA-1.
- **Rotate secrets** — database credentials, API keys, signing secrets — on a regular schedule.

---

## 5. Rate Limiting & Throttling: Protect Against Abuse

Without rate limiting, your API is vulnerable to brute force attacks, credential stuffing, DoS, and scraping.

### Apply rate limits at multiple levels

```
┌─────────────────────────────────────────────┐
│               API Gateway                   │
│   Global rate limit: 10,000 req/min         │
├─────────────────────────────────────────────┤
│               Per IP: 100 req/min           │
├─────────────────────────────────────────────┤
│         Per User/API Key: 1,000 req/min     │
├─────────────────────────────────────────────┤
│  Sensitive Endpoints (login): 5 req/min     │
└─────────────────────────────────────────────┘
```

### Return proper rate limit headers

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1709654400
Retry-After: 60
```

### Use progressive delays for authentication endpoints

Brute force attacks on login endpoints are extremely common. Add exponential backoff after repeated failures, and consider temporary account lockouts after N failed attempts.

---

## 6. HTTPS & Transport Security

### Enforce HTTPS strictly

```http
# Redirect all HTTP to HTTPS
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Set security headers on every response

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'none'
Cache-Control: no-store          # for sensitive endpoints
Referrer-Policy: no-referrer
Permissions-Policy: geolocation=(), camera=()
```

### Configure CORS properly

```javascript
// ❌ Dangerous — allows any origin
app.use(cors({ origin: "*" }));

// ✅ Explicit allowlist
app.use(
  cors({
    origin: ["https://app.yourcompany.com", "https://admin.yourcompany.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
```

---

## 7. Logging, Monitoring & Alerting

You can't defend what you can't see.

### Log the right things

Every request should produce a structured log entry:

```json
{
  "timestamp": "2026-03-05T14:22:01Z",
  "requestId": "req_7f3a9b2c",
  "method": "POST",
  "path": "/api/users/login",
  "statusCode": 401,
  "ip": "203.0.113.42",
  "userAgent": "Mozilla/5.0...",
  "userId": null,
  "durationMs": 142
}
```

### Never log sensitive data

- ❌ Passwords, tokens, API keys
- ❌ Full credit card numbers or SSNs
- ❌ Session cookies
- ✅ Truncated/masked identifiers are fine: `sk_live_abc...xyz`

### Alert on anomalies

Set up alerts for:

- Spike in 401/403 responses (potential credential stuffing)
- Unusual request volumes from a single IP or user
- Access to sensitive endpoints outside business hours
- Repeated access to non-existent resources (enumeration attempts)

---

## 8. Dependency & Supply Chain Security

Your code is only as secure as the libraries it depends on.

### Audit and update dependencies regularly

```bash
# npm
npm audit
npm audit fix

# Python
pip-audit
safety check
```

- Pin dependency versions in production. Floating versions (`^1.2.3`) can pull in a compromised patch.
- Enable **Dependabot** or **Renovate** to automate security updates.
- Vet new dependencies before adding them — check download counts, maintainer activity, and known CVEs.

### Use a Software Bill of Materials (SBOM)

For production systems, generate and maintain an SBOM so you can quickly identify impact when a new CVE drops.

---

## 9. Secrets Management

Hardcoded secrets are one of the most common causes of breaches, and they're entirely avoidable.

### The golden rule: secrets never belong in code

```bash
# ❌ Hardcoded — will end up in git history forever
DATABASE_URL = "postgres://admin:supersecret@prod-db:5432/app"

# ✅ From environment / secrets manager
DATABASE_URL = os.environ["DATABASE_URL"]
```

### Use a dedicated secrets manager

- **HashiCorp Vault** — self-hosted, powerful
- **AWS Secrets Manager / Parameter Store** — great for AWS-native stacks
- **GCP Secret Manager / Azure Key Vault** — cloud-native alternatives
- **Doppler / Infisical** — developer-friendly, cloud-agnostic

### Rotate secrets automatically

Secrets that are never rotated are a ticking time bomb. Automate rotation and ensure your application handles secret refreshes gracefully without downtime.

---

## 10. Security Testing: Verify, Don't Assume

Security controls are only valuable if they actually work.

### Integrate security into CI/CD

```yaml
# Example GitHub Actions security pipeline
- name: Dependency Audit
  run: npm audit --audit-level=high

- name: Static Analysis (SAST)
  uses: github/codeql-action/analyze@v3

- name: Secret Scanning
  uses: trufflesecurity/trufflehog@v3

- name: OWASP Dependency Check
  uses: dependency-check/Dependency-Check_Action@main
```

### Test your own endpoints

- **OWASP ZAP** — automated DAST (Dynamic Application Security Testing)
- **Burp Suite** — manual API security testing
- Write **security-focused unit tests** for your auth and authorization logic
- Conduct or commission **penetration tests** at least annually for production APIs

---

## Quick Reference: Security Checklist

Before shipping any API to production, run through this checklist:

**Authentication & Authorization**

- [ ] All endpoints require authentication (unless explicitly public)
- [ ] Object-level authorization checks on every data access
- [ ] JWTs are short-lived and properly validated
- [ ] API keys are hashed at rest and scoped to minimum permissions

**Input & Output**

- [ ] All inputs validated against a schema
- [ ] Parameterized queries used everywhere
- [ ] Sensitive fields stripped from all responses
- [ ] Error messages don't leak internal details

**Transport & Headers**

- [ ] HTTPS enforced with HSTS
- [ ] Security headers set on all responses
- [ ] CORS configured with an explicit allowlist

**Operational**

- [ ] Rate limiting applied to all endpoints
- [ ] Structured logging in place (without sensitive data)
- [ ] Alerting configured for anomalies
- [ ] Secrets stored in a secrets manager, not in code
- [ ] Dependencies audited and up to date

---

## The Bottom Line

API security isn't a feature you add at the end of a sprint — it's a discipline woven into every layer of your system. The good news is that most attacks exploit known, preventable vulnerabilities. You don't need to be a security expert to dramatically reduce your attack surface; you just need to be consistent.

Validate everything. Authorize every access. Expose as little as possible. Log everything meaningful. And test your assumptions — because security controls that haven't been verified might as well not exist.

> _The goal isn't a perfectly unhackable API. The goal is to make attacking your API more expensive than it's worth._
