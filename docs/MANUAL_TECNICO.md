# Manual técnico — MetaSoft Directory

## Stack

| Capa | Tecnología |
|------|------------|
| UI | React 19, Vite 8, TypeScript, React Router |
| API | Node.js, Express, TypeScript (tsx), Mongoose |
| DB | MongoDB local |
| Seed | Python 3, BeautifulSoup, requests, pymongo |
| PDF | PDFKit |
| Scraping runtime | Cheerio + fetch |
| Seguridad | Helmet, express-rate-limit, Zod, bcryptjs, JWT, AES-256-GCM |

## Estructura

```text
/
  frontend/          SPA
  backend/src/       API
  scraper/seed.py    Carga Tabla 1
  docs/              Manuales
  LICENSE            Propietaria © Joan Mora
```

## Variables de entorno (`backend/.env`)

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI MongoDB |
| `PORT` | Puerto API (4000) |
| `CORS_ORIGIN` | Orígenes permitidos |
| `JWT_SECRET` | Firma JWT (≥32 chars) |
| `JWT_EXPIRES` | p.ej. `2h` |
| `DATA_ENCRYPTION_KEY` | 64 hex chars (32 bytes) |
| `NODE_ENV` | development/production |

Frontend: `VITE_API_URL=http://localhost:4000/api`

## Scripts

```bash
npm run dev           # API + UI
npm run seed          # python scraper/seed.py
npm run build         # build backend + frontend
```

## Seed

`scraper/seed.py` upserta las 15 casas de la Tabla 1. Si hay `website`, intenta scrapear meta/og, logo y links; calcula `dataStatus`.

## Cifrado

`backend/src/utils/crypto.ts` usa AES-256-GCM. Formato almacenado: `iv:tag:ciphertext` (hex). Los hooks de Mongoose cifran `phone` al guardar y descifran al leer.

## Extracción

1. Validación SSRF (`services/ssrf.ts`)
2. Fetch HTML con timeout
3. Cheerio + sanitize-html
4. Interpretación heurística → description/highlights
5. `computeDataStatus`

## Producción

- Generar secretos fuertes
- `NODE_ENV=production`
- Build frontend sin source maps (`vite.config.ts`)
- No publicar el repositorio como público
- MongoDB con autenticación en despliegues reales

## Pruebas manuales sugeridas

1. Health `GET /api/health`
2. Seed + búsqueda `CODAL`
3. Registro + import URL pública
4. Editar preview → solo guardado privado
5. Favorito + export PDF múltiple
