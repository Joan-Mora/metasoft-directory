# Manual técnico — MetaSoft Directory

**Versión:** 0.2.0 · **Fecha:** 2026-10-30 · **Autor:** Joan Mora

---

## 1. Propósito de este documento

Describir cómo está construido el sistema para desarrolladores, docentes evaluadores y operación local: stack, módulos, variables, flujos críticos y checklist de verificación.

Para visión de producto y API de alto nivel, ver también [`../ARCHITECTURE.md`](../ARCHITECTURE.md).

---

## 2. Stack y versiones de referencia

| Capa | Tecnología | Notas |
|------|------------|--------|
| UI | React 19, Vite 8, TypeScript, React Router 7 | SPA Signal Layer |
| Motion | `motion` (Framer Motion v11+) | Microinteracciones / respeto a reduced-motion vía CSS |
| API | Node.js 20+, Express 5, tsx, Mongoose 9 | ESM (`"type": "module"`) |
| DB | MongoDB (servicio local) | URI `mongodb://127.0.0.1:27017/directorio_casas` |
| Seed | Python 3.10+, BeautifulSoup4, requests, pymongo | `scraper/seed.py` |
| Scraping runtime | Cheerio, sanitize-html, fetch nativo | `backend/src/services/extract.ts` |
| PDF | PDFKit | `backend/src/services/pdf.ts` |
| Validación | Zod | Auth, companies, extract, export |
| Auth | bcryptjs, jsonwebtoken | Coste bcrypt 12 |
| Crypto | Node `crypto` AES-256-GCM | Teléfonos |

---

## 3. Árbol de módulos

```text
frontend/src/
  api/client.ts           Cliente HTTP + downloadPdf
  components/             UI de presentación
  context/                Auth + Theme
  hooks/                  useApi, useTheme, useReducedMotion
  pages/                  Rutas lazy (excepto Home)
  index.css               Design tokens de la UI

backend/src/
  index.ts                Bootstrap Express + Mongo
  config.ts               Env + Zod
  models/                 User, Company, Extraction, Favorite
  routes/                 auth, companies, extract, extractions, favorites, exportPdf
  services/               extract, pdf, ssrf
  middleware/             auth, errorHandler
  utils/                  crypto, dataStatus

scraper/seed.py           Upsert Tabla 1 + enrich
```

---

## 4. Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Conexión MongoDB |
| `PORT` | Puerto HTTP (default 4000) |
| `NODE_ENV` | `development` \| `production` |
| `CORS_ORIGIN` | Orígenes permitidos (coma-separados) |
| `JWT_SECRET` | ≥ 32 caracteres |
| `JWT_EXPIRES` | Ej. `2h` |
| `DATA_ENCRYPTION_KEY` | 64 caracteres hex (32 bytes) |

### Frontend (`frontend/.env`)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base API, ej. `http://localhost:4000/api` |

Plantilla: [`.env.example`](../.env.example).

---

## 5. Scripts npm

| Comando | Efecto |
|---------|--------|
| `npm run dev` | API + Vite en paralelo (`concurrently`) |
| `npm run seed` | `python scraper/seed.py` |
| `npm run build` | Build backend (`tsc`) + frontend (`tsc -b && vite build`) |
| `npm run lint` (en `frontend/`) | oxlint |

---

## 6. Seed (Python)

1. Lee las 15 filas de la Tabla 1 (nombre, dirección, especialidad, teléfono, website curada si existe).
2. Si hay website: GET HTML, extrae og/meta, logo, links sociales, headings.
3. Genera `description` / `highlights` y calcula `dataStatus`.
4. `update_one(..., upsert=True)` en colección `companies`.

Empresas con sitio alcanzable en seed típico: CODALTEC, SASOFTCO, Seobyte → suelen quedar `complete`. El resto permanece `partial` con datos de tabla.

---

## 7. Extracción runtime (TypeScript)

Archivo: `backend/src/services/extract.ts`.

1. `assertSafeUrl` (SSRF).
2. Fetch con abort a 15s.
3. Cheerio + limpieza.
4. Interpretación heurística (sin API de pago).
5. `computeDataStatus`.

UI: `ImportPage` anima pasos; `ExtractPreviewModal` usa `<dialog>`.

---

## 8. Frontend — notas de implementación

- Tema: `data-theme` en `<html>` + `localStorage` (`metasoft-theme`).
- Command palette global en `Layout`.
- `CompanyCardView`: logo como `<a>`, `CompletenessRing`, highlight de query.
- `useApi`: AbortController + reload.
- Lazy routes en `App.tsx` (Home eager para LCP).
- Build: `sourcemap: false`, minify esbuild; **sin** ofuscación post-build.

---

## 9. PDF de exportación

- Multi-selección: `POST /api/export/pdf` con `companyIds` / `extractionIds`.
- Preview: `POST /api/export/pdf/preview` con array `cards`.
- Paleta de exportación alineada a la UI (cian `#0891b2` / tinta `#0b1220`).

---

## 10. Checklist de verificación local

1. Servicio MongoDB **Running**.
2. `npm run seed` sin error de ping.
3. `GET /api/health` → `{ ok: true }`.
4. UI: búsqueda `CODAL`, categorías, registro, import URL pública, favorito, PDF.
5. Editar preview → solo modo privado habilitado.
6. `npm run build` en `frontend/` sin errores TypeScript.

---

## 11. Despliegue (orientación)

- Generar secretos fuertes; `NODE_ENV=production`.
- MongoDB con autenticación; API detrás de HTTPS.
- CORS estricto al dominio del frontend.
- Mantener el repositorio **privado**.
