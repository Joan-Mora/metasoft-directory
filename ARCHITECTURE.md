# Architecture — MetaSoft Directory

## Overview

Monorepo with three runtime pieces:

1. **frontend/** — React + Vite + TypeScript SPA
2. **backend/** — Express + TypeScript REST API + Mongoose
3. **scraper/** — Python seed/enrichment into MongoDB

```text
Browser (SPA)
    │  JWT Bearer
    ▼
Express API  ──► MongoDB (companies, users, extractions, favorites)
    │
    ├── extract service (Cheerio + interpret)
    ├── pdf service (PDFKit)
    └── crypto (AES-256-GCM)

Python seed ──► MongoDB companies
```

## Data model

- **users** — identity; password hashes only.
- **companies** — global directory (Tabla 1 + enrichment).
- **extractions** — personal/published extractions pages owned by a user.
- **favorites** — user bookmarks to company or extraction refs.

`dataStatus` is derived:

- `none` — no relevant enriched fields
- `partial` — at least one relevant field
- `complete` — address+specialty+phone and website+logo+description

## Auth & tenancy

- Guests: read global companies / published extractions.
- Authenticated: CRUD mutations, extract preview, favorites, personal space.
- `manuallyModified=true` forces private-only persistence.

## Security boundaries

| Layer | Control |
|-------|---------|
| Transport | CORS allowlist; Helmet |
| AuthN | JWT |
| AuthZ | owner checks on extractions/favorites |
| Data | bcrypt + AES field encryption |
| Ingress scrape | SSRF IP/DNS checks |
| Client | no secrets; no prod source maps |

## Key API surface

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/register` | rate-limited |
| POST | `/api/auth/login` | rate-limited |
| GET | `/api/companies?q=` | partial name search |
| GET | `/api/companies/by-status/:status` | categories |
| POST | `/api/extract/preview` | auth + SSRF |
| POST | `/api/extractions` | save modes |
| GET/POST | `/api/favorites` | personal |
| POST | `/api/export/pdf` | multi-id export |
| POST | `/api/export/pdf/preview` | card payload PDF |

## Frontend routes

`/`, `/directorio`, `/categorias`, `/importar`, `/mis-extracciones`, `/admin`, `/auth`

## Design system

Teal/terracotta accents on soft green-gray background, Fraunces + DM Sans. PDF layout mirrors the same ink/accent palette for visual uniformity.
