# Manual de usuario — MetaSoft Directory

**Versión:** 0.2.0 · **Interfaz:** Signal Layer · **Autor:** Joan Mora

---

## 1. Introducción

MetaSoft Directory es una **consola de extracción de datos** sobre un directorio de casas desarrolladoras de software. Permite:

- Consultar y buscar empresas en el canal **global**.
- Importar una **URL oficial**, ver la extracción interpretada y guardarla.
- Administrar un espacio **personal** (Mis Extracciones + Favoritos).
- Exportar fichas a **PDF** (una o varias).

URL local por defecto: **http://localhost:5173**

---

## 2. Acceso y registro

| Acción | ¿Requiere cuenta? |
|--------|-------------------|
| Ver inicio y directorio | No |
| Ver categorías | No |
| Favoritos, importar con guardado, publicar, Mis Extracciones, CRUD | **Sí** |

1. Pulsa **Entrar** (o ve a `/auth`).
2. Crea cuenta (nombre, correo, contraseña ≥ 8 caracteres) o inicia sesión.
3. La landing explica que el espacio personal requiere registro.

**Atajo:** `Ctrl` + `K` (Windows/Linux) o `⌘` + `K` (macOS) abre la paleta para buscar empresas o saltar de sección.

**Tema:** icono sol/luna en la barra superior (preferencia persistente).

---

## 3. Inicio

- Headline y explicación del sistema.
- Demo animada del flujo **URL → escaneo → extracción → ficha**.
- CTAs: Explorar directorio, Registrarme, Importar URL.
- Bloques sobre SNR, global vs personal, PDF y atajos.

---

## 4. Directorio global

1. Menú **Directorio**.
2. Escribe parte del nombre (ej. `CODAL`) y **Buscar** — la coincidencia se resalta.
3. Cada ficha muestra:
   - Logo / iniciales (clic abre el sitio oficial en nueva pestaña si hay web).
   - Anillo de completitud (SNR) + badges Completa / Parcial / Sin datos.
   - Especialidad, dirección, teléfono, extracto de descripción.
4. Menú **⋮** → **Guardar en Favoritos** (con sesión).
5. **Modo selección** → marca varias fichas → barra flotante **N seleccionadas → Exportar PDF**.

Chip visual: canal **GLOBAL**.

---

## 5. Categorías (niveles de señal)

| Categoría | Significado |
|-----------|-------------|
| Completas | Núcleo Tabla 1 + web + logo + descripción |
| Datos parciales | Al menos un dato relevante |
| Sin datos registrados | Sin enriquecimiento útil |

Cada banda usa color, textura y tipografía mono distintas (no solo color).

---

## 6. Importar página (flujo protagonista)

1. Inicia sesión.
2. Pega una URL `https://…` del sitio a analizar.
3. Observa el pipeline: Conectando → Leyendo HTML → Extrayendo → Interpretando.
4. Se abre la **vista previa** ordenada.

### Acciones en la vista previa

| Acción | Efecto |
|--------|--------|
| **Descartar** | Cierra sin persistir |
| **Editar / corregir** | Aviso previo; marca *Modificado manualmente*; **deshabilita publicar** |
| **Guardar PDF** | Descarga PDF de la preview |
| **Guardar ▾ → Solo para mí** | Mis Extracciones (privado) |
| **Guardar ▾ → Para mí y publicar** | Personal + canal global (si no está editado a mano) |
| **Guardar ▾ → Solo publicar** | Solo canal global (si no está editado a mano) |

---

## 7. Mis Extracciones

Chip **CANAL PRIVADO**.

- Pestaña **Personales**: tus fichas; modo selección → PDF.
- Pestaña **Favoritos**: atajos guardados desde el menú ⋮.

---

## 8. CRUD (administración)

Con sesión: crear, editar y eliminar casas del directorio global.  
La eliminación pide **confirmación**. Las ediciones se marcan como modificadas manualmente.

---

## 9. Buenas prácticas

- Usa solo sitios **oficiales** al importar.
- No publiques datos personales de terceros sin autorización.
- Si corregiste a mano una extracción, guárdala solo en tu espacio personal.
- En móviles, usa el menú ☰; los botones cumplen tamaño táctil ≥ 44px.

---

## 10. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| No carga el directorio | API en `:4000`, MongoDB en marcha, `npm run seed` |
| No puedo guardar | Debes estar autenticado |
| No puedo publicar tras editar | Comportamiento esperado (*Modificado manualmente*) |
| Extracción rechazada | URL inválida, sitio caído o bloqueo SSRF (no uses localhost) |
