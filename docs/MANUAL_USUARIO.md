# Manual de usuario — MetaSoft Directory

**Versión:** 0.3.0 · **Interfaz:** Signal Layer · **Autor:** Joan Mora · **Fecha:** 2026-10-30

---

## 1. Introducción

MetaSoft Directory es una **consola de extracción de datos** sobre un directorio de casas desarrolladoras de software. Permite:

- Consultar y buscar empresas en el canal **global** (semilla + importaciones publicadas).
- Importar una **URL oficial**, ver la extracción interpretada y guardarla.
- Evitar **duplicados** por dominio (variaciones de ruta no cuentan como sitio distinto).
- Administrar un espacio **personal** (Mis Extracciones + Favoritos).
- Gestionar el directorio con **CRUD** separado en Fuente y Externas.
- Exportar fichas a **PDF** (una o varias).

URL local por defecto: **http://localhost:5173**

---

## 2. Acceso y registro

| Acción | ¿Requiere cuenta? |
|--------|-------------------|
| Ver inicio y directorio | No |
| Favoritos, importar con guardado, publicar, Mis Extracciones, CRUD | **Sí** |

1. Pulsa **Entrar** (o ve a `/auth`).
2. Crea cuenta (nombre, correo, contraseña ≥ 8 caracteres) o inicia sesión.
3. La landing explica que el espacio personal requiere registro.

**Atajo:** `Ctrl` + `K` (Windows/Linux) o `⌘` + `K` (macOS) abre la paleta para buscar empresas o saltar de sección.

**Tema:** icono sol/luna en la barra superior (preferencia persistente).

> `/categorias` redirige a `/directorio` (compatibilidad).

---

## 3. Inicio

- Headline y explicación del sistema.
- Demo animada del flujo **URL → escaneo → extracción → ficha**.
- CTAs: Explorar directorio, Registrarme, Importar URL.
- Bloques sobre SNR, global vs personal, PDF y atajos.

---

## 4. Directorio (búsqueda + filtros)

Un solo módulo: búsqueda y filtros de completitud juntos. Incluye casas **semilla** y **importaciones publicadas**.

1. Menú **Directorio**.
2. Escribe parte del nombre (ej. `CODAL`) y **Buscar** — la coincidencia se resalta.
3. Filtra con las pestañas: **Todas / Completas / Parciales / Sin datos**.
4. Cada ficha muestra logo (clic → sitio oficial), anillo SNR, badges, datos y descripción.
5. Menú **⋮** (se abre hacia arriba, sin cortarse) → **Sitio oficial** / **Guardar en Favoritos**.
6. Al guardar en favoritos aparece un **mensaje de éxito** con enlace a Mis Extracciones.
7. **Modo selección** → marca varias fichas → barra flotante **Exportar PDF**.

### Completitud (SNR)

| Estado | Criterio |
|--------|----------|
| **Completa** | Faltan como máximo **2** campos clave **y** hay **logo** |
| **Parcial** | Faltan **3 o más** campos, o faltan ≤2 pero **sin logo** |
| **Sin datos** | Ningún campo de información útil |

Campos clave: dirección, especialidad, teléfono, sitio web, logo, banner, descripción, links, destacados.

---

## 5. Importar página (flujo protagonista)

1. Inicia sesión.
2. Pega una URL `https://…` del sitio a analizar.
3. El sistema **valida duplicados** antes de extraer: si el **dominio** ya existe (en directorio o en una importación previa), se muestra un aviso y **no** continúa.
   - Ejemplo: `https://abacore.co` y `https://abacore.co/inicio` se tratan como el **mismo sitio**.
4. Observa el pipeline: Conectando → Leyendo HTML → Extrayendo → Interpretando.
5. Se abre la **vista previa** ordenada.
6. Aparece un **mensaje de éxito** al completar la extracción y al guardar.
7. Al final de la página hay un **historial de actividad** (extracciones OK, fallidas y guardados) con fecha, nombre y URL. Puedes actualizarlo o limpiarlo.

### Acciones en la vista previa

| Acción | Efecto |
|--------|--------|
| **Descartar** | Cierra y **vuelve al estado inicial** del pipeline (sin persistir) |
| **Editar / corregir** | Aviso previo; marca *Modificado manualmente*; **deshabilita publicar** |
| **Guardar PDF** | Descarga PDF de la preview |
| **Guardar ▾ → Solo para mí** | Solo **Mis Extracciones** (privado) |
| **Guardar ▾ → Para mí y publicar** | **Mis Extracciones** + **Directorio** |
| **Guardar ▾ → Solo publicar** | Solo **Directorio** (no aparece en Mis Extracciones) |

El menú **Guardar ▾** se despliega **por encima** de la tarjeta, sin alargar el modal.

### Dónde queda cada guardado

| Modo | Mis Extracciones | Directorio |
|------|------------------|------------|
| Solo para mí | Sí | No |
| Para mí y publicar | Sí | Sí |
| Solo publicar | No | Sí |

---

## 6. Mis Extracciones

Chip **CANAL PRIVADO**.

- Pestaña **Personales**: fichas con visibilidad privada o «ambos» (no incluye *Solo publicar*).
- Pestaña **Favoritos**: atajos guardados desde el menú ⋮; al añadir desde Personales verás confirmación de éxito.
- Modo selección → PDF de las seleccionadas.

---

## 7. CRUD (administración)

Con sesión, en **CRUD** gestionas dos orígenes:

| Filtro / sección | Contenido |
|------------------|-----------|
| **Todas** | Fuente + Externas |
| **Fuente** | Casas del sistema o creadas por admin (colección semilla / Company) |
| **Externas** | Importaciones de usuarios (Extraction) |

Operaciones en ambas: **crear**, **editar**, **eliminar** (con confirmación).

- Al crear puedes elegir tipo **Fuente** o **Externa**.
- En externas puedes fijar la **visibilidad** (solo directorio / ambos / solo personal).
- Si el **sitio web** ya existe (mismo dominio), el formulario avisa y **bloquea** el guardado.
- Tras editar una casa de fuente se marca como modificada manualmente.

---

## 8. Buenas prácticas

- Usa solo sitios **oficiales** al importar.
- No publiques datos personales de terceros sin autorización.
- Si corregiste a mano una extracción, guárdala solo en tu espacio personal.
- No intentes reimportar un dominio ya registrado (ni con otra ruta).
- En móviles, usa el menú ☰; los botones cumplen tamaño táctil ≥ 44px.

---

## 9. Problemas frecuentes

| Síntoma | Qué revisar |
|---------|-------------|
| No carga el directorio | API en `:4000`, MongoDB en marcha, `npm run seed` |
| No puedo guardar | Debes estar autenticado |
| No puedo publicar tras editar | Comportamiento esperado (*Modificado manualmente*) |
| Extracción rechazada | URL inválida, sitio caído, bloqueo SSRF o **dominio duplicado** |
| «Solo publicar» no aparece en Mis Extracciones | Correcto: solo va al Directorio |
| Importación nueva no se ve en Directorio | Debe haberse guardado con *Solo publicar* o *Para mí y publicar*; recarga el Directorio |
| Menú ⋮ o Guardar no se ve | Debe abrirse hacia arriba; recarga la página si tenías una versión antigua en caché |
| Favorito sin confirmación | Debe mostrarse un aviso verde; inicia sesión si el menú lo pide |
