# Changelog

Todos los cambios relevantes de este proyecto se documentan aquí.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).  
Versionado semántico [SemVer](https://semver.org/lang/es/).

## [0.3.0] — 2026-10-30

### Added
- Historial de actividad de importación (`ImportActivity`) con listado en Importar.
- Mensajes de éxito al extraer, guardar, favoritos y exportar PDF.
- Anti-duplicados por dominio (`siteKey` + `duplicateSite`); check previo y HTTP 409.
- CRUD admin dual: **Fuente** / **Externas** / **Todas** (`/companies/source`, `/extractions/admin/*`).
- Directorio unificado: compañías semilla + extracciones publicadas (`refType`).

### Changed
- Visibilidad: *Solo publicar* → solo Directorio; *Para mí y publicar* → ambos; mine excluye `published`.
- SNR: completa si faltan ≤2 campos y hay logo; parcial si faltan ≥3 (o ≤2 sin logo).
- Extracción: JSON-LD, `tel:`, footer/contacto, ubicación CO; hooks Mongoose 9 sin `next()`.
- Menús ⋮ y Guardar ▾ como overlays (no alargan la card); Descartar reinicia el pipeline.
- Manual de usuario y manual técnico actualizados a 0.3.

### Fixed
- Error al guardar extracción (`next is not a function` en `pre('save')`).
- Favoritos desde directorio con `refType` correcto para importaciones.

## [0.2.0] — 2026-10-30

### Added
- Dirección de arte **Signal Layer** (tokens, tema claro/oscuro, grain, SNR rings).
- Command palette (Ctrl/⌘+K), drawer móvil accesible, indicador de ruta activa.
- Pipeline animado de importación (conectar → leer → extraer → interpretar).
- `useApi` + `StateView` (loading / empty / error) en vistas principales.
- Selection dock flotante para exportación PDF múltiple.
- Lazy-loading de rutas; tipografías con `preconnect` + `font-display: swap`.

### Changed
- Rediseño completo de la capa visual (ya no plantilla SaaS genérica).
- Logos oficiales como enlaces `<a target="_blank">`.
- Preview de extracción migrado a `<dialog>` nativo.
- Identidad del PDF de exportación alineada a la UI.
- README / ARCHITECTURE / SECURITY / manuales actualizados a estado 0.2.

### Removed
- Ofuscación post-build del bundle (manteniendo minify + sin source maps).
- Estilos y assets residuales del template Vite no usados.

## [0.1.0] — 2026-10-29

### Added
- SPA React/Vite + API Express TypeScript + MongoDB local.
- Auth registro/login (JWT + bcrypt).
- Directorio, categorías SNR, CRUD.
- Seed Python de Tabla 1 (15 casas) con enriquecimiento.
- Extracción URL + preview + modos de guardado + bloqueo por edición manual.
- Mis Extracciones, Favoritos, export PDF.
- Hardening de seguridad y licencia propietaria.

[0.3.0]: https://github.com/Joan-Mora/metasoft-directory/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Joan-Mora/metasoft-directory/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Joan-Mora/metasoft-directory/releases/tag/v0.1.0
