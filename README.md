# MetaSoft Directory

**Consola de extracción e inteligencia de datos** para casas desarrolladoras de software (Taller 1 C3 — Gestión y Operación de Bases de Datos, Uniminuto).

| | |
|---|---|
| **Producto** | MetaSoft Directory · dirección de arte *Signal Layer* |
| **Autor** | Joan Mora |
| **Repositorio** | [github.com/Joan-Mora/metasoft-directory](https://github.com/Joan-Mora/metasoft-directory) (**privado**) |
| **Licencia** | Propietaria — ver [`LICENSE`](LICENSE) |
| **Versión** | 0.2.0 |

---

## ¿Qué es?

No es un catálogo estático: es una herramienta que:

1. Mantiene un **directorio global** de 15 casas de software (Tabla 1) en **MongoDB**.
2. **Enriquece** esos registros con scraping (logo, banner, links, descripción interpretada).
3. Permite **importar cualquier URL oficial**, extraer e interpretar la información, previsualizarla y guardarla (personal / publicada).
4. Clasifica cada ficha por **nivel de señal (SNR)**: completa, parcial o sin datos.
5. Exporta **PDF** con la misma identidad visual de la interfaz.

Los visitantes exploran el directorio libremente. **Guardar, publicar, favoritos y espacio personal requieren registro.**

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 19 · Vite 8 · TypeScript · React Router 7 · Motion |
| Backend | Node.js · Express 5 · TypeScript · Mongoose |
| Base de datos | MongoDB local |
| Seed / scraping batch | Python 3 · BeautifulSoup · requests · pymongo |
| Extracción en runtime | Cheerio · fetch · sanitize-html |
| PDF | PDFKit (API) |
| Seguridad | Helmet · rate-limit · Zod · bcrypt · JWT · AES-256-GCM · SSRF guards |

---

## Arranque rápido

```bash
# 1. Entorno
cp .env.example backend/.env
# Completa JWT_SECRET (≥32 chars) y DATA_ENCRYPTION_KEY (64 hex)

# 2. Dependencias
npm install
npm install --prefix backend
npm install --prefix frontend
pip install -r scraper/requirements.txt

# 3. Datos iniciales (Tabla 1 + enriquecimiento)
npm run seed

# 4. Desarrollo (API :4000 + UI :5173)
npm run dev
```

| Servicio | URL |
|----------|-----|
| Interfaz | http://localhost:5173 |
| Health API | http://localhost:4000/api/health |

Atajo en la UI: **Ctrl / ⌘ + K** — paleta de comandos (buscar empresa o navegar).

---

## Capacidades principales

- Búsqueda por nombre (parcial) con resaltado de coincidencia
- Fichas con logo clicable → sitio oficial, anillo SNR, menú ⋮ → Favoritos
- Categorías: completa / parcial / sin datos (sistema visual coherente)
- Importar URL con pipeline animado y vista previa (`<dialog>`)
- Guardar: solo para mí · para mí y publicar · solo publicar  
  (si se edita a mano → etiqueta *Modificado manualmente* → solo privado)
- Mis Extracciones (privado) + pestaña Favoritos
- Exportación PDF individual y multi-selección (barra flotante)
- CRUD autenticado de casas del directorio global
- Tema claro / oscuro persistente

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitectura, modelo de datos, API, UI |
| [`SECURITY.md`](SECURITY.md) | Política y controles de seguridad |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de versiones |
| [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) | Guía de uso end-to-end |
| [`docs/MANUAL_TECNICO.md`](docs/MANUAL_TECNICO.md) | Setup, módulos, env, despliegue |
| [`LICENSE`](LICENSE) | Licencia propietaria © Joan Mora |

---

## Estructura del monorepo

```text
├── frontend/          SPA (React + Vite)
├── backend/           API REST (Express + MongoDB)
├── scraper/           Seed Python + enriquecimiento
├── docs/              Manuales de usuario y técnico
└── LICENSE / README / ARCHITECTURE / SECURITY / CHANGELOG
```

---

## Propiedad intelectual

Código y documentación © **Joan Mora**. Repositorio privado. Queda prohibida la copia, redistribución o reutilización sin autorización escrita del titular. El uso académico por docentes del curso Uniminuto para evaluación está permitido según los términos de [`LICENSE`](LICENSE).
