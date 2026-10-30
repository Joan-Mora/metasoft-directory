# Manual técnico — MetaSoft Directory

**Versión:** 0.3.0 · **Fecha:** 2026-10-30 · **Autor:** Joan Mora

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
| Validación | Zod | Auth, companies, extract, export, admin |
| Auth | bcryptjs, jsonwebtoken | Coste bcrypt 12 |
| Crypto | Node `crypto` AES-256-GCM | Teléfonos |

> **Mongoose 9:** los hooks `pre('save')` no reciben `next` callable. Usar middleware síncrono/async **sin** `next()` (ver `Company` / `Extraction`).

---

## 3. Árbol de módulos

```text
frontend/src/
  api/client.ts           Cliente HTTP + downloadPdf
  components/             UI (cards, dialog preview, dock, states)
  context/                Auth + Theme
  hooks/                  useApi, useTheme, useReducedMotion
  pages/                  Rutas lazy (excepto Home)
  types/                  CompanyCard, Extraction, ImportActivity, …
  index.css               Design tokens Signal Layer

backend/src/
  index.ts                Bootstrap Express + Mongo
  config.ts               Env + Zod
  models/                 User, Company, Extraction, Favorite, ImportActivity
  routes/                 auth, companies, extract, extractions,
                          favorites, exportPdf, importActivity
  services/               extract, pdf, ssrf, duplicateSite
  middleware/             auth, errorHandler
  utils/                  crypto, dataStatus, siteKey

scraper/seed.py           Upsert Tabla 1 + enrich
```

---

## 4. Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | Conexión MongoDB |
| `PORT` | Puerto HTTP (default 4000); bind `0.0.0.0` |
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

## 6. Modelos y visibilidad

| Modelo | Rol |
|--------|-----|
| `Company` | Semilla / CRUD **Fuente** |
| `Extraction` | Importaciones de usuarios (**Externas**) |
| `ImportActivity` | Historial de importación por usuario |
| `Favorite` | Favoritos (`refType`: `company` \| `extraction`) |
| `User` | Cuentas JWT |

### Visibilidad de `Extraction`

| Valor | Mis Extracciones (`GET /extractions/mine`) | Directorio unificado |
|-------|--------------------------------------------|----------------------|
| `private` | Sí | No |
| `both` | Sí | Sí (si `manuallyModified: false`) |
| `published` | **No** | Sí (si `manuallyModified: false`) |

Mapeo desde modos de guardado UI:

- `private` → `private`
- `private_and_publish` → `both`
- `publish` → `published`

---

## 7. API relevante (0.3)

| Método | Ruta | Notas |
|--------|------|--------|
| GET | `/api/companies` | Directorio unificado: Company + Extraction publicadas; recalcula SNR al vuelo; `refType` |
| GET | `/api/companies/source` | Solo semilla/admin (auth) |
| POST/PUT/DELETE | `/api/companies[/:id]` | CRUD Fuente + anti-duplicado |
| POST | `/api/extract/preview` | Extracción; 409 si dominio duplicado; registra actividad |
| POST | `/api/extract/check-duplicate` | Pre-chequeo dominio |
| POST | `/api/extractions` | Guardado usuario (modos) |
| GET | `/api/extractions/mine` | Solo `private` + `both` |
| GET | `/api/extractions/admin/all` | Todas las externas (CRUD) |
| POST/PUT/DELETE | `/api/extractions/admin[/:id]` | CRUD admin sobre externas |
| GET/DELETE | `/api/import-activity/mine` | Historial / limpiar |
| POST | `/api/favorites` | `refType` + `refId` |
| POST | `/api/export/pdf` | `companyIds` y/o `extractionIds` |

---

## 8. Seed (Python)

1. Lee las 15 filas de la Tabla 1.
2. Si hay website: GET HTML, extrae og/meta, logo, links, headings.
3. Genera `description` / `highlights` y calcula `dataStatus`.
4. `update_one(..., upsert=True)` en colección `companies`.

---

## 9. Extracción runtime y anti-duplicados

### Extracción — `services/extract.ts`

1. `assertSafeUrl` (SSRF).
2. Fetch con abort a 15s.
3. Captura JSON-LD **antes** de remover `<script>`.
4. Cheerio + limpieza; `tel:`, footer/contacto, patrones CO, ubicación etiquetada.
5. Interpretación heurística.
6. `computeDataStatus`.

### Clave de sitio — `utils/siteKey.ts`

Normaliza hostname (minúsculas, sin `www.`). Path e query **no** forman parte de la clave:

`abacore.co` ≡ `abacore.co/inicio`

### Duplicados — `services/duplicateSite.ts`

Compara claves contra `Company.website|sourceUrl` y `Extraction.website|sourceUrl`. Usado en:

- preview / check-duplicate
- POST extractions / companies
- CRUD admin

Respuesta típica: HTTP **409** + mensaje en español.

### Completitud — `utils/dataStatus.ts`

- Cuenta 9 campos clave.
- `complete` si `missing ≤ 2` **y** hay logo.
- `partial` en caso contrario con algún dato.
- `none` si no hay datos útiles.

---

## 10. Frontend — notas 0.3

- **ImportPage:** validación duplicado → pipeline → preview; mensajes de éxito; historial; reset al descartar/guardar.
- **ExtractPreviewModal:** footer fijo; dropdown `dropdown-up` fuera del scroll.
- **CompanyCardView:** menú ⋮ hacia arriba; `is-menu-open` eleva z-index; card `overflow: visible`.
- **DirectoryPage:** favoritos con `refType`; toast de éxito; PDF mixto company/extraction.
- **AdminPage:** filtros Todas / Fuente / Externas; CRUD dual; check duplicado en website.
- **MyExtractionsPage:** toast al favorito; mine excluye `published`.

---

## 11. PDF de exportación

- Multi-selección: `POST /api/export/pdf` con `companyIds` / `extractionIds`.
- Preview: `POST /api/export/pdf/preview` con array `cards`.
- Paleta alineada a Signal Layer.

---

## 12. Checklist de verificación local

1. Servicio MongoDB **Running**.
2. `npm run seed` sin error de ping.
3. `GET /api/health` → `{ ok: true }`.
4. UI: búsqueda `CODAL`, registro, import URL pública, favorito (toast), PDF.
5. Importar dominio ya existente → aviso / 409.
6. *Solo publicar* → aparece en Directorio, no en Mis Extracciones.
7. *Para mí y publicar* → ambos sitios.
8. Editar preview → solo modo privado habilitado.
9. CRUD: ver subsecciones Fuente/Externas y filtros.
10. Descartar importación → pipeline vuelve a estado inicial.
11. `npm run build` en `frontend/` sin errores TypeScript.

---

## 13. Despliegue (orientación)

- Generar secretos fuertes; `NODE_ENV=production`.
- Bind API a `0.0.0.0:$PORT` (p. ej. Render).
- Filesystem efímero: no depender de disco local para datos.
- MongoDB con autenticación; API detrás de HTTPS.
- CORS estricto al dominio del frontend.
- Mantener el repositorio **privado**.
