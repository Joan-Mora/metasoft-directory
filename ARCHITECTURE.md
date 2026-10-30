# Arquitectura — MetaSoft Directory

**Versión del documento:** 0.2.0 · **Fecha:** 2026-10-30 · **Autor:** Joan Mora

---

## 1. Visión

MetaSoft Directory es una **consola de extracción e inteligencia de datos** orientada a un directorio de casas de software. El diseño de producto (*Signal Layer*) comunica escaneo, capas de señal y completitud medible (SNR), no un catálogo decorativo regional.

---

## 2. Diagrama de contexto

```text
┌─────────────────────┐     JWT Bearer      ┌──────────────────────┐
│  SPA (React/Vite)   │ ──────────────────► │  API Express (TS)    │
│  Signal Layer UI    │ ◄────────────────── │  /api/*              │
└─────────────────────┘     JSON / PDF      └──────────┬───────────┘
                                                       │
                       ┌───────────────────────────────┼───────────────┐
                       ▼                               ▼               ▼
                 ┌──────────┐                 ┌─────────────┐   ┌────────────┐
                 │ MongoDB  │                 │ Extract     │   │ PDFKit     │
                 │ local    │                 │ Cheerio+    │   │ export     │
                 └────▲─────┘                 │ interpret   │   └────────────┘
                      │                       └─────────────┘
                 ┌────┴─────┐
                 │ Python   │  seed Tabla 1 + scrape batch
                 │ scraper  │
                 └──────────┘
```

---

## 3. Componentes del monorepo

| Módulo | Rol |
|--------|-----|
| `frontend/` | SPA: rutas, auth client, fichas SNR, import pipeline, command palette, tema |
| `backend/src/` | API REST, modelos Mongoose, auth, extract, PDF, crypto |
| `scraper/` | Carga inicial de las 15 empresas + enriquecimiento HTTP |
| `docs/` | Manuales de usuario, técnico y diseño |
| `scripts/` | Utilidades locales (p. ej. informe PDF) |

---

## 4. Modelo de datos (MongoDB)

### `users`
Identidad. Solo `passwordHash` (bcrypt). Nunca se expone en JSON.

### `companies`
Directorio **global** (Tabla 1 + seed). Campos clave: `name`, `address`, `specialty`, `phone` (cifrado en reposo vía API), `website`, `logoUrl`, `bannerUrl`, `links[]`, `description`, `highlights[]`, `dataStatus`, `manuallyModified`, `sourceUrl`, `scrapedAt`.

### `extractions`
Fichas personales / publicadas. Incluye `ownerId`, `visibility` ∈ {`private`, `published`, `both`}. Si `manuallyModified === true` → solo privado.

### `favorites`
`userId` + `refType` (`company` \| `extraction`) + `refId`.

### Cálculo de `dataStatus` (SNR)

| Valor | Criterio |
|-------|----------|
| `none` | Sin campos relevantes enriquecidos |
| `partial` | Al menos un campo relevante |
| `complete` | address + specialty + phone **y** website + logoUrl + description |

---

## 5. Autenticación y tenencia

| Actor | Puede |
|-------|--------|
| Visitante | Leer directorio global y extracciones publicadas |
| Usuario autenticado | CRUD mutaciones, extract preview, favoritos, Mis Extracciones, export PDF personal |

JWT en header `Authorization: Bearer …`. Expiración corta configurable (`JWT_EXPIRES`).

---

## 6. Superficie API

| Método | Ruta | Notas |
|--------|------|-------|
| GET | `/api/health` | Liveness |
| POST | `/api/auth/register` | Rate-limited |
| POST | `/api/auth/login` | Rate-limited |
| GET | `/api/auth/me` | Perfil |
| GET | `/api/companies?q=` | Búsqueda parcial |
| GET | `/api/companies/by-status/:status` | Categorías SNR |
| POST/PUT/DELETE | `/api/companies` | CRUD (auth) |
| POST | `/api/extract/preview` | Auth + SSRF |
| GET/POST/PUT/DELETE | `/api/extractions` | Espacio personal / publish |
| GET/POST/DELETE | `/api/favorites` | Favoritos |
| POST | `/api/export/pdf` | Multi-id |
| POST | `/api/export/pdf/preview` | PDF desde payload |

---

## 7. Frontend (rutas y módulos UI)

| Ruta | Vista |
|------|-------|
| `/` | Landing informativa + demo de pipeline |
| `/directorio` | Búsqueda, bento de fichas, selección → PDF |
| `/categorias` | Bandas SNR |
| `/importar` | Pipeline de extracción + preview dialog |
| `/mis-extracciones` | Personales + Favoritos |
| `/admin` | CRUD |
| `/auth` | Login / registro |

Componentes clave: `Layout`, `CommandPalette`, `CompanyCardView`, `CompletenessRing`, `StateView`, `SelectionDock`, `ExtractPreviewModal`.

Hooks: `useApi`, `useTheme`, `useReducedMotion`.

---

## 8. Flujo de extracción

1. Validación SSRF (solo http/https; deniega localhost / IPs privadas).
2. Fetch HTML con timeout y User-Agent académico.
3. Parseo Cheerio + sanitización.
4. Interpretación heurística → `description` / `highlights`.
5. Cálculo de `dataStatus`.
6. UI: preview → descartar / editar / PDF / guardar (3 modos).

---

## 9. Seguridad (resumen)

Ver [`SECURITY.md`](SECURITY.md). Capas: Helmet, CORS, rate-limit, Zod, bcrypt, JWT, AES-256-GCM en teléfonos, SSRF, ownership, source maps desactivados en producción.

---

## 10. Identidad visual (Signal Layer)

Tokens CSS en `frontend/src/index.css`: superficies profundas, acento cian (`--signal`) y violeta (`--signal-2`), tipografías Syne / IBM Plex Sans / IBM Plex Mono, anillos SNR, scan-line, tema claro/oscuro. El PDF de exportación reutiliza la misma paleta.
