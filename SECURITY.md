# Política de seguridad — MetaSoft Directory

| Campo | Valor |
|-------|--------|
| Titular | Joan Mora |
| Proyecto | MetaSoft Directory (Taller 1 C3) |
| Repositorio | Privado — github.com/Joan-Mora/metasoft-directory |
| Versiones soportadas | 0.2.x, 0.1.x |

---

## Reporte de vulnerabilidades

**No** abrir issues públicos con detalles de explotación.

1. Contactar al titular (Joan Mora) vía Security Advisories del repositorio privado o el canal académico acordado con el docente.
2. Incluir: endpoint afectado, impacto, pasos de reproducción (sin escaneo masivo).
3. Permitir un plazo razonable de remediación antes de cualquier divulgación.

---

## Controles implementados

### Secretos y configuración
- `.env` fuera de Git; solo existe `.env.example` como plantilla.
- Arranque con validación Zod de variables críticas.
- Sin secretos embebidos en el frontend (`VITE_API_URL` es pública de entorno).

### Autenticación y autorización
- Contraseñas con **bcrypt** (coste ≥ 12); `passwordHash` excluido de serialización.
- **JWT** firmado con `JWT_SECRET` (≥ 32 caracteres), expiración corta.
- Extracciones privadas acotadas a `ownerId`.
- Publicación bloqueada si `manuallyModified === true`.

### Datos en reposo
- Teléfonos cifrados con **AES-256-GCM** (`DATA_ENCRYPTION_KEY`, 32 bytes hex).
- Formato: `iv:tag:ciphertext`.

### Hardening HTTP / API
- **Helmet**, CORS por allowlist, rate-limit global y en auth/extract.
- Validación de entrada con **Zod**.
- Mensajes de error genéricos en producción (sin stack traces al cliente).

### Extracción web
- Protección **SSRF**: solo `http`/`https`; deniega localhost, link-local e IPs privadas (resolución DNS).
- Sanitización HTML del contenido scrapeado.
- Timeout de fetch.

### Cliente
- Source maps desactivados en producción.
- Bundle minificado; rutas con code-splitting (lazy).
- Objetivos táctiles ≥ 44px; `:focus-visible`; `prefers-reduced-motion`.

---

## Recomendaciones operativas

1. Rotar `JWT_SECRET` y `DATA_ENCRYPTION_KEY` ante sospecha de fuga.
2. Mantener MongoDB en localhost (o con auth) en desarrollo.
3. En internet: HTTPS, reverse proxy endurecido, secretos en vault/CI.
4. Repositorio **privado** + licencia propietaria: la licencia es protección jurídica; el JS del navegador siempre es inspeccionable.
5. No versionar PDFs generados en `local/` ni dumps de base de datos.
