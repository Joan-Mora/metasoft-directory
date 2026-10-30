# Security Policy

**Owner:** Joan Mora  
**Project:** MetaSoft Directory (Taller 1 C3)

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

Do **not** open public issues with exploit details.

1. Contact the repository owner (Joan Mora) privately through GitHub Security Advisories on the private repository, or via the academic channel agreed with the course instructor.
2. Include: affected endpoint, impact summary, and steps to reproduce (no mass scanning).
3. Allow reasonable time for a fix before any disclosure.

## Security controls implemented

- **Secrets:** never committed; use `.env` / `.env.example` only as template.
- **Passwords:** bcrypt cost factor ≥ 12; `passwordHash` excluded from JSON.
- **Tokens:** JWT signed with `JWT_SECRET` (min 32 chars), short expiry.
- **Field encryption:** sensitive phones encrypted at rest with AES-256-GCM (`DATA_ENCRYPTION_KEY`).
- **HTTP hardening:** Helmet, strict CORS, global + route rate limits.
- **Input validation:** Zod schemas on auth, companies, extract, export.
- **SSRF protection:** extract endpoint blocks localhost/private IPs and non-http(s).
- **HTML sanitization:** scraped text cleaned before interpretation/storage.
- **Authorization:** private extractions scoped to `ownerId`; publish blocked when `manuallyModified`.
- **Client build:** production source maps disabled; assets minified.
- **Errors:** generic messages in production; no stack traces to clients.

## Operational recommendations

- Rotate `JWT_SECRET` and `DATA_ENCRYPTION_KEY` if leaked.
- Keep MongoDB bound to localhost in development.
- Use HTTPS and hardened reverse proxy in any internet deployment.
- Prefer a **private** GitHub repository; proprietary LICENSE is legal protection, not a cryptographic lock on browser JS.
