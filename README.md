# MetaSoft Directory — Taller 1 C3

Directorio web de casas desarrolladoras de software con MongoDB local, extracción e interpretación de páginas, espacio personal, favoritos y exportación PDF.

**Autor:** Joan Mora  
**Licencia:** Propietaria — ver [`LICENSE`](LICENSE). Queda prohibida la copia, redistribución o reutilización sin autorización escrita.

## Requisitos

- Node.js 20+
- Python 3.10+
- MongoDB local en ejecución (`mongodb://127.0.0.1:27017`)

## Arranque rápido

```bash
# 1) Variables de entorno
cp .env.example backend/.env
# Edita JWT_SECRET y DATA_ENCRYPTION_KEY

# 2) Dependencias
npm install
npm install --prefix backend
npm install --prefix frontend
pip install -r scraper/requirements.txt

# 3) Seed (Tabla 1 + scraping)
npm run seed

# 4) Desarrollo (API :4000 + UI :5173)
npm run dev
```

Frontend: http://localhost:5173  
API health: http://localhost:4000/api/health

## Funcionalidades

- Búsqueda por nombre (parcial) y fichas resumen
- Categorías: completas / parciales / sin datos
- CRUD de casas (autenticado)
- Importar URL → vista previa → PDF / editar / guardar (privado, publicar, ambos)
- Mis Extracciones + Favoritos
- Exportación PDF multi-selección
- Seguridad: helmet, rate-limit, JWT, bcrypt, AES-256-GCM, SSRF guard

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arquitectura del sistema |
| [`SECURITY.md`](SECURITY.md) | Política y prácticas de seguridad |
| [`CHANGELOG.md`](CHANGELOG.md) | Historial de versiones |
| [`docs/MANUAL_USUARIO.md`](docs/MANUAL_USUARIO.md) | Manual de usuario |
| [`docs/MANUAL_TECNICO.md`](docs/MANUAL_TECNICO.md) | Manual técnico |

## Aviso de propiedad

Este repositorio es **privado** y el código está protegido por licencia propietaria de Joan Mora. El build de producción desactiva source maps y minifica el cliente; la protección efectiva combina controles técnicos, repositorio privado y licencia.
