## 2026-10-20 — Publicacion resiliente de GitHub Pages

**Objetivo:** reducir fallos en cadena de `update-data` causados por una publicacion de Pages todavia activa. Usuario autorizo publicar en main usando la conexion GitHub de la sesion.
**Hecho:** grupo `pages` sin cancelacion activa, timeout de 20 min por intento, espera de 120 s y un unico reintento obligatorio; limite del job 45 min, URL del intento exitoso y limpieza solo tras exito. Cinco regresiones incluidas en `npm test`.
**Verificacion previa:** RED 4 fallos nuevos + 1 invariante correcta, GREEN 5/5; suite 25 Vitest + 12 Node aprobada. Verificador independiente comprobo cinco escenarios. Revision nativa de riesgo, resiliencia y fiabilidad aprobada y confirmada, sin bloqueantes.
**Decisiones:** conservar cron, permisos, credenciales, notificaciones y datos; usar la accion oficial. Un segundo fallo deja el workflow en rojo. Revertir este ajuste no requiere modificar snapshots ni el descargador.
**Estado y proximo paso:** verificar una ejecucion real de Actions tras publicar y la fecha de datos servida por el sitio; el resultado se registra en el cierre local de sesion. No se simulo una caida real de Pages. La tolerancia a demoras no garantiza recuperacion de una caida del proveedor. Cambios de codigo y tests en el commit asociado a esta entrada.

---

## 2026-10-13 — Difusión de LUZ·RM y portafolio

**Objetivo:** dos vistas para LinkedIn y actualización del portafolio con un artículo de beneficios, abordaje y tecnologías.
**Hecho:** piezas JPG 1080×1350 en output/linkedin/01-luz-rm.jpg y 02-portafolio.jpg, fuente HTML con fuentes/capturas locales y texto-linkedin.txt con copy y alternativas. No se publicó en LinkedIn. Portafolio identificado por Pages como geoidegeoidal/geoidegeoidal.github.io (julloa.space); checkout aislado en tmp/portfolio, rama codex/luz-rm-project-story.
**Decisiones:** piezas con capturas reales fechadas, sin métricas de impacto inventadas ni promesa de tiempo real. Ficha común de LUZ·RM actualizada y caso editorial en /bitacora/luz-rm-cortes-energia-territorio/; conservar layouts/identidad existentes y enlaces oficiales.
**Verificación:** Jekyll/check_site 11 páginas, SEO, 7 rutas×4 anchos sin errores/axe; diez fichas de terminal y 200% pasan. Artículo escritorio/móvil y piezas 1080×1350 inspeccionadas; no formularios ni avisos reales.
**Publicación:** portafolio `dafc3f1` en main; Pages `38488765532` success. Artículo y ficha de Código comprobados en julloa.space, incluido el enlace al artículo. Paquete output/linkedin-luz-rm-portafolio.zip con dos JPG, copy/alt y fuente HTML/capturas/fuente/licencia.
**Bloqueantes:** ninguno. Próximo: publicación de LinkedIn por el propietario; ningún envío realizado. Los commits del portafolio están en su repositorio separado. No se probó hardware móvil ni lector de pantalla real.

---

# HANDOFF.md — Última sesión / handoff entre sesiones

## 2026-10-13 — Aviso ciudadano georreferenciado a Enel

**Objetivo**: facilitar desde LUZ·RM avisos de fallas con ubicación, dejando
claro que el proyecto es independiente y el registro se completa con Enel.

**Hecho**: botón AVISAR FALLA A ENEL en ANÁLISIS y diálogo con dirección buscada,
punto del mapa o coordenadas WGS84, tipo de falla y descripción. Vista previa
local y consentimiento para WhatsApp/Meta al abrir el canal y Enel al enviar.
WhatsApp oficial +56 9 9444 7606 verificado en la página de emergencias de Enel;
mensaje con coordenadas y enlace Google Maps. Copia alternativa con recuperación
de errores; cerrar o cancelar selección conserva el borrador, pero reabrir exige
consentimiento nuevo. Sin backend, GPS automático ni datos de cliente; borrador
solo en memoria/DOM. No se declara enviado/recibido ni se inventan números de caso.
README, NOTICE, sistema visual y AGENTS actualizados con el flujo y proveedores.

**Decisiones**: enlace al canal oficial, sin automatizar el bot ni simular una
integración de recepción. El usuario envía el mensaje y sigue las indicaciones
de Enel. Mantener el diálogo accesible, con foco atrapado y retorno al origen.

**Verificación**: 25/25 Vitest + 7/7 Node, TypeScript y build. Smoke Chrome con
mapa, búsqueda, radio, nearest, hexbin y PDF preservados; aviso con prefilling,
texto hostil sin ejecutar HTML, coordenadas fuera de RM, recuperación del
portapapeles, consentimiento invalidado al cambiar datos/reabrir, borrador,
selección/cancelación y foco. Vistas 320/390 y escritorio inspeccionadas.
`window.open` interceptado en E2E: no se enviaron avisos de prueba a Enel.

**Bloqueantes**: ninguno para el flujo de preparación. No se verificó el
registro de un caso real con el bot de Enel; solo Enel puede confirmarlo.
**Publicación**: commit `aa0ac5c` en `main`; deploy exitoso del run de actualización
`38474821695` (el deploy directo `38474766567` fue reemplazado por concurrencia).
Botón y diálogo verificados en producción `https://julloa.space/luz-rm/`, destino
confirmado por la API de Pages y autorizado por el usuario para la revisión.
Captura `output/fault-notice-production.png`; no se abrió WhatsApp ni se envió
ningún aviso real.
**Próximo**: sin pendientes de implementación; la recepción de avisos reales
debe confirmarla Enel. Base de trabajo `33282ae`; rama
`codex/georeferenced-fault-notice`.

---

## 2026-10-13 — Activación del programador externo

**Objetivo**: completar la actualización gratuita cada 5 min en producción.

**Hecho**: el usuario completó MFA de GitHub y autorizó generar el PAT y
guardarlo en cron-job.org. Token `luz-rm-scheduler`, solo `geoidegeoidal/luz-rm`,
Actions:read/write y Metadata:read, vencimiento **11/01/2027**. Tarea **8640374**
guardada y habilitada en la cuenta del usuario; minutos 1,6,11,...56, todos los
días (America/Santiago), POST HTTPS con ref main, timeout 20 s, sin guardar
respuestas, avisos tras 3 fallos y por deshabilitación. No se creó API key
administrativa. El token solo se transfirió por la UI autorizada y se retiró de
las variables de trabajo; no se guardó en archivos, commits ni chat.

**Verificación**: prueba desde cron-job.org `204 No Content` en 1,5 s; GitHub run
`38472226308` completó fetch, build y deploy con éxito. Primera ejecución
programada ejecutada a las **18:41:02** (programada 18:41:00; variación 2,44 s,
HTTP 204 en 2,88 s); run GitHub `38472433462` completado con éxito. Historial:
`https://console.cron-job.org/jobs/8640374/history`. Próximas ejecuciones a las
18:46, 18:51 y 18:56. La prueba externa no dejó artefactos (`total_count: 0`).

**Decisiones**: renovar el PAT antes del 11/01/2027 y actualizar Authorization
en la misma tarea; no generar tareas duplicadas ni usar credenciales más amplias.
No hay cuota de un backend de pago ni runner permanente.

**Bloqueantes**: ninguno; programador activo y primera ejecución real verificada.
**Próximo**: renovar el PAT antes del 11/01/2027. No se creó recordatorio futuro.
Implementación publicada: `8a0616e`; snapshot de prueba previo: `bdf71e5`.

---

## 2026-10-13 — Actualización más frecuente sin servicios de pago

**Objetivo**: reducir el atraso de Enel -> espejo -> Pages con una opción
gratuita y permisos limitados.

**Completado**: diagnóstico de Actions (35 runs desde el 6/10, intervalos de
2 h 43 min a 9 h 26 min; mediana 5 h 44 min), instalador idempotente de
cron-job.org por HTTPS cada 5 min, plantilla de variables locales, guía de
activación/rotación/verificación y 7 pruebas del instalador. Workflow limitado
a `main` público, checkout actual de `main`, timeout 10 min, cron de respaldo
fuera del minuto cero. Deploy elimina solo su artefacto tras éxito (20 MB por
ejecución observados), con Actions:write limitado a ese job y retención de 1 día
para artefactos fallidos/cancelados. No se alteró la interfaz ni el modelo.

**Decisiones**: conservar el espejo y rebuild de Pages; no usar proxies CORS
públicos ni un runner con bucle permanente. Fine-grained PAT exclusivamente de
luz-rm con Actions:write, caducidad y custodia en cron-job.org; nunca reutilizar
el token de `gh auth`. API key administrativa opcional: la consola permite
configurarlo sin ella. El repo debe seguir público con runners estándar.

**Validación**: 17/17 Vitest + 7/7 Node, TypeScript sin errores, build Vite,
YAML/permisos/conexión del artefacto y ausencia de variables/secretos del
programador en `dist`. Vitest/build requieren ejecución fuera del sandbox de
Windows por EPERM de `realpath`; no fue un fallo de código.

**Estado al cerrar la implementación (resuelto en la entrada de activación)**:
el usuario creó cron-job.org y está autenticado.
En la pestaña existente se preparó Crear cronjob, URL fija de workflow_dispatch,
horario de 5 min, POST, JSON ref main, timeout y cabeceras sin token. Todavía no
se guardó ni activó. GitHub pidió Confirm access (MFA) antes del formulario de
PAT; el usuario debe completar esa verificación. `.env.local` solo tiene campos
vacíos e ignorados por Git. No imprimir token al leer árboles AX/capturas.

**Siguiente previsto entonces (ya completado arriba)**: completar MFA y crear PAT restringido, asignarlo a Authorization
en cron-job.org fuera del chat, prueba real + verificación de Actions/Pages,
guardar tarea, medir próximos disparos. Actualizar este estado tras activación.
**Commit publicado**: `8a0616e` en `main` (implementación + documentación).
Checkout de trabajo en `codex/faster-data-updates`. Deploy `38470721319` exitoso:
build + Pages confirmados y API de artefactos del run devuelve `total_count: 0`.
Prueba manual `update-data` en main (`38470934321`) exitosa: descarga 14 s,
build 26 s y deploy 11 s; artefactos del run `total_count: 0`. El snapshot
confirmado pasó a `13/10 18:26`, descargado a las 18:29 de Chile.
La tarea externa todavía espera MFA/PAT y no está guardada/activa.

---

> **Convención**: este archivo es el puente entre sesiones de opencode.
> Al final de cada sesión de trabajo, el agente (o el usuario a mano) actualiza
> las secciones abajo. Al iniciar la próxima sesión, opencode lee este archivo
> **antes** de tocar código, y sabe exactamente dónde se quedó.
>
> Reglas:
> - Mantener orden cronológico inverso (la sesión más reciente arriba).
> - Borrar entradas mayores a ~10 sesiones. Una vez consolidadas las decisiones
>   clave, pasan a `AGENTS.md` si son permanentes, o se eliminan.
> - No reemplaza a `AGENTS.md`: AGENTS es contexto permanente del proyecto
>   (decisiones, trampas resueltas); HANDOFF es estado puntual de la(s) última(s)
>   sesión(es).

---

## Sesión actual / próxima

**Estado**: la guia persistente de indicadores y el README editorial fueron
publicados en `main` mediante `d610139`. Después, a solicitud del usuario, se
aplicó localmente una separación completa entre identidad y procedencia:
`LUZ·RM` reemplaza a `ENEL·LUZ` como marca visible en masthead, metadatos,
reporte, README y capturas. “Enel” queda limitado a identificar la fuente de
datos y la aplicación declara expresamente que es un proyecto independiente.

La licencia MIT ahora identifica a `geoidegeoidal` como titular. `NOTICE.md`
separa el código propio de datos operativos, marcas, cartografía, servicios,
tipografías y dependencias de terceros. El footer enlaza los avisos legales.
El usuario renombró posteriormente el repositorio a `luz-rm`. La URL activa de
Pages es `https://geoidegeoidal.github.io/luz-rm/`; la ruta anterior devuelve
404. El proyecto usa `base: './'`, por lo que los assets son portables y solo
requieren actualizar enlaces, metadatos y remote.

Durante la revisión PDF se detectó que Enel puede publicar varias geometrías con
el mismo nombre de comuna (caso COLINA). El cross-filter, los KPIs, el ranking y
el reporte ahora combinan todas las geometrías, suman clientes afectados y usan
`CLIENTESTOTAL` una sola vez.

**Validación final**: Vitest 17/17, `tsc --noEmit`, build Vite y smoke E2E con
identidad, aviso legal, reportes RM/comuna, mapa, geoprocesos y exportación.
Las capturas reales del README y su cabecera SVG se regeneraron e inspeccionaron
con la marca LUZ·RM.

**Próximo paso al retomar**: publicar, si el usuario lo solicita, la actualización
de referencias posterior al rename del repositorio. La inscripción de software
ante el DDI no se
realizó: es facultativa y requiere datos personales, declaración de participantes
y una actuación del titular. La recomendación para el aviso Node 20 de Actions es
actualizar `checkout`/`setup-node` y el build a Node 24 en un cambio separado;
mantener las majors oficiales actuales de las actions de Pages hasta que GitHub
publique reemplazos Node 24. No se modificó el workflow en esta sesión.

---

## Historial de sesiones

### 2026-07-26 — Rename técnico del repositorio

**Objetivo**: adaptar el checkout y los enlaces al cambio
`geoidegeoidal/enel-luz` -> `geoidegeoidal/luz-rm`.

**Hecho**:
- URL de Pages, README, metadata npm y enlace legal actualizados.
- Remote local apuntado al nuevo repositorio.
- Identidad del bot de snapshots actualizada a `luz-rm-bot`.
- `vite.config.ts` auditado: `base: './'` evita cambios de rutas de assets.

**Verificación**:
- Nuevo Pages responde 200 con LUZ·RM.
- La URL antigua de Pages responde 404.
- GitHub mantiene Pages con `build_type: workflow` sobre `main`.

### 2026-07-26 — Identidad neutral y alcance de licencias

**Objetivo**: evitar que el nombre del producto sugiera afiliación con la fuente
de datos y aclarar qué materiales cubre la licencia MIT.

**Hecho**:
- Marca pública `LUZ·RM` en aplicación, reporte, README, SVG y metadatos.
- Titular MIT corregido a `geoidegeoidal`.
- `NOTICE.md` con alcance del código propio, marcas, datos, mapas,
  geocodificación, fuentes y dependencias.
- Aviso persistente y enlace legal en el footer.
- IDs de estilos, paquete, salida PDF y almacenamiento de tema neutralizados;
  la preferencia guardada con la clave anterior se migra como fallback.
- El slug `enel-luz` se conservó inicialmente; posteriormente el usuario
  renombró el repositorio a `luz-rm`.

**Validación**:
- Vitest 17/17, TypeScript, build y smoke E2E: OK.
- Capturas de dashboard, indicadores, gráficos, diagnóstico y reporte
  regeneradas; cabecera SVG renderizada e inspeccionada.

### 2026-07-26 — README editorial y arquitectura visual

**Objetivo**: reemplazar la documentacion generica por una entrada coherente con
el centro de mando y util para lectores operativos y tecnicos.

**Hecho**:
- Cabecera SVG propia con la reticula y paleta ENEL·LUZ.
- Narrativa organizada en ocho modulos numerados: proposito, vistas,
  arquitectura, integridad, tecnologia, desarrollo, publicacion y licencia.
- Capturas reales del mapa, indicadores con guia, graficos, diagnostico y
  primera pagina del reporte.
- Diagramas Mermaid del pipeline Enel -> espejo -> Pages y del flujo interno
  loader -> modelo -> store -> alcance -> visualizaciones/reporte.
- Script `scripts/readme-shots.mjs` para regenerar los assets sin mockups.

**Validacion**:
- SVG parseado como XML valido; rutas y assets del README verificados.
- Build Vite y smoke E2E: OK.
- Capturas de indicadores y reporte inspeccionadas visualmente.

### 2026-07-26 — Guia de indicadores operativos

**Objetivo**: eliminar la ambiguedad de la matriz operacional del dashboard.

**Hecho**:
- Encabezado propio y guia siempre visible para los seis indicadores.
- Definiciones de ventana temporal, signo, percentiles, ETA y eventos sin ETA.
- Nota metodologica sobre alcance activo y deduplicacion por ID.
- Reticula 2 x 3 en escritorio y una columna en mobile, sin tooltips obligatorios.

**Validacion**:
- Vitest 17/17, `tsc --noEmit`, build Vite y smoke E2E: OK.
- Revision visual local en escritorio y mobile: seis definiciones legibles y
  sin recortes; la reticula mobile resolvio una columna de 346 px.

### 2026-07-26 — Legibilidad y mapa operacional del reporte

**Objetivo**: corregir la tipografía demasiado pequeña y convertir el mapa
coroplético en una vista útil para diagnóstico.

**Hecho**:
- Cuerpo, tablas, metadatos y etiquetas SVG aumentados manteniendo la retícula.
- Incidencias activas deduplicadas representadas con contorno y rombo naranja.
- Avisos individuales representados como puntos cian con borde blanco.
- Leyenda territorial separa severidad, incidencias y avisos con conteos.
- El patrón quedó persistido en `.interface-design/system.md`.

**Validación**:
- Vitest 17/17, `tsc --noEmit`, build Vite y smoke E2E: OK.
- PDF RM y COLINA regenerados; sus cuatro páginas finales fueron renderizadas a
  PNG e inspeccionadas sin recortes, solapamientos ni texto ilegible.

### 2026-07-26 — Sistema visual + reporte PDF RM/comuna

**Objetivo**: persistir el lenguaje visual y crear un reporte regional o comunal
exportable a PDF, cuidando diseño, semántica y fidelidad de datos.

**Hecho**:
- Sistema visual documentado con dirección, tokens, retícula, profundidad,
  patrones de dashboard/reporte y controles de calidad.
- Botón `REPORTE PDF` integrado al alcance operativo; usa RM, comuna o área
  dibujada activa sin backend.
- Vista previa accesible con dos páginas A4 apaisadas y acción
  `IMPRIMIR / GUARDAR PDF`.
- Primera página: identidad, metadatos, KPIs, mapa vectorial de severidad,
  lectura ejecutiva e indicadores operativos.
- Segunda página: reloj centrado en AHORA, escala ETA, eventos prioritarios,
  comunas con mayor impacto y metodología.
- Script reproducible `scripts/report-pdf.mjs` para generar muestras con Chrome.
- Comunas multi-geometría agregadas correctamente en mapa, filtros, KPIs,
  gráfico de impacto y reporte.

**Validación**:
- `npm test`: 5 archivos, 17/17 pruebas OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Smoke E2E: reporte RM y comunal, dos páginas, mapa SVG y acción PDF OK.
- PDF RM y COLINA reabiertos, validados como 2 páginas 841.9 x 595 pt y
  renderizados a PNG para inspección visual.

**Cambios de repo**:
- Cambios locales pendientes sin commit.
- `output/` y `tmp/` ignorados; muestras PDF se conservan localmente para
  entrega, no para versionado.
- `assets/mobile_*.png` y `preview-err.log` permanecen intactos.

### 2026-07-26 — Inteligencia operacional + cross-filter

**Objetivo**: elevar la visualización de datos sin romper la dirección visual
flat tipo panel de instrumentos suizo y publicar el resultado.

**Hecho**:
- Seleccionar una comuna o dibujar un polígono filtra de forma coherente mapa,
  clusters, hexbin, KPIs y los cuatro gráficos; el alcance siempre queda visible
  y puede volver a toda la RM con un control dedicado.
- Nuevo panorama operacional con presión de 60 minutos, cambio contra la hora
  anterior, edades P50/P90, ETA vencidas y eventos sin ETA.
- Gráfico firma “Reloj operativo · ±12 h” centrado en AHORA y escala de
  reposición ordenada por urgencia; ranking e impacto comunal conservados.
- KPIs corregidos para distinguir incidencias activas únicas, descargos únicos y
  conteos de polígonos de las capas.
- Fechas Enel interpretadas explícitamente en `America/Santiago`; gráficos
  temporales actualizados por minuto sin depender de una descarga nueva.
- Buscador RM, geoprocesos deduplicados, tema dinámico y documentación previa
  integrados en el mismo paquete.
- Capturas `final_initial.png`, `final_charts.png` y `final_diag.png`
  regeneradas con datos reales.

**Validación**:
- `npm test`: 4 archivos, 11/11 pruebas OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- Smoke E2E de producción local: OK, incluido filtro por comuna y retorno a RM.
- Revisión independiente: todos los hallazgos críticos e importantes
  incorporados; sin bloqueantes restantes.

**Cambios de repo**:
- Publicación directa en `main` solicitada por el usuario; el deploy se realiza
  mediante `.github/workflows/deploy.yml`.
- `assets/mobile_*.png` y `preview-err.log` permanecen fuera de versión.

### 2026-07-26 — Correcciones de revisión + cobertura de regresión

**Objetivo**: corregir todos los hallazgos funcionales de la revisión integral
y proponer el siguiente salto de calidad para la visualización de datos sin
alterar la dirección visual plana tipo panel de instrumentos suizo.

**Hecho**:
- Buscador restringido a la RM tanto en Photon/Nominatim como en validación
  cliente; resultados construidos con DOM seguro para evitar inyección HTML.
- Deduplicación de incidencias aplicada también al diagnóstico de dirección y
  al radio de 500 m; `CLITOTAL` ya no se infla por polígonos repetidos.
- El filtro espacial reemplaza la fuente de avisos visible, por lo que clusters
  y etiquetas se recalculan sólo con los puntos filtrados.
- Gráficos pueden renderizar antes que el mapa y sus colores de ejes/tooltips
  se recalculan con la paleta activa al cambiar de tema.
- README, footer y AGENTS alineados con el deploy real y el carácter
  best-effort del cron.
- Añadido Vitest con 6 pruebas de regresión para búsqueda RM, deduplicación,
  radio, diagnóstico y filtrado/reclustering.
- Smoke E2E endurecido con geocoder simulado, resultado malicioso controlado y
  aserciones reales para búsqueda, XSS, mapa, radio, incidencia cercana,
  hexbin y tema.
- Revisión independiente sin bloqueantes; sus observaciones sobre IDs
  alternativos, restablecimiento del clúster y determinismo del smoke quedaron
  incorporadas.

**Validación**:
- `npm test`: 3 archivos, 6/6 pruebas OK.
- `tsc --noEmit`: OK.
- `npm run build`: OK.
- `node scripts/smoke.mjs http://127.0.0.1:43129/ ...`: OK.
- `git diff --check`: OK (sólo avisos de conversión LF/CRLF de Git).

**Cambios de repo**:
- Cambios pendientes sin commit en código, tests, documentación y lockfile.
- No se hizo commit, push ni deploy.
- No se tocaron `assets/mobile_*.png` ni `preview-err.log`.

### 2026-07-26 — Revisión integral + conexión GitHub verificada

**Objetivo**: revisar el proyecto completo, explicar su arquitectura y dejar
GitHub disponible para controlar los repositorios del usuario.

**Hecho**:
- Recorrido completo de código, estilos, datos, scripts y workflows.
- Dependencias instaladas localmente; `npm run build` y `tsc --noEmit` OK.
- Smoke E2E con Chrome OK: mapa, gráficos, búsqueda, radio, incidencia cercana
  y hexbin renderizan; captura generada correctamente.
- Producción verificada: Pages respondió con `datos: "26/07 04:24"`.
- Actions verificado: el run `30194732878` actualizó datos a `b95b2b3`, construyó
  el artefacto desde ese commit y desplegó Pages con éxito.
- Plugin/conector GitHub ya estaba instalado y conectado como `geoidegeoidal`;
  acceso a `geoidegeoidal/luz-rm` confirmado con permisos admin/maintain/
  pull/push/triage. GitHub CLI también está autenticado con scopes
  `repo` y `workflow`.

**Hallazgos pendientes (no corregidos en esta sesión)**:
1. `src/geo/search.ts`: `RM_BBOX` está declarado pero no se envía a Photon. El
   smoke de “Apoquindo 4500” seleccionó “Apoquindo, La Unión” y sacó el mapa de
   la RM.
2. `src/geo/analysis.ts:125-136`: `bufferStats()` cuenta polígonos, no eventos,
   y suma `CLITOTAL` sin deduplicar por `INCIDENCIA`; reintroduce la inflación
   que KPIs y ranking ya evitan.
3. `src/map/layers.ts:328-332`: el filtro espacial de avisos solo se aplica a
   `avisosPoints`; clusters y sus etiquetas siguen agregando todos los avisos.
4. `src/main.ts:283-288`: `refreshViews()` retorna si el mapa aún no existe,
   por lo que contradice el comentario de renderizar gráficos antes de tiles.
5. `src/charts/charts.ts:30-41`: estilos base de ejes/tooltips capturan la
   paleta clara al importar; el cambio a dark mode no recalcula todos esos
   colores.
6. `README.md:69` afirma que los commits de datos no disparan rebuild, pero el
   workflow actual llama explícitamente a `deploy.yml` cuando cambian datos.
7. El cron declara `*/5`, pero los runs observados se ejecutan aproximadamente
   cada hora por la naturaleza best-effort de GitHub Actions; no garantiza
   frescura real de cinco minutos.

**Cambios de repo**:
- Solo esta actualización de `HANDOFF.md`.
- No se modificó código de producto ni se tocaron los archivos no versionados
  existentes (`assets/mobile_*.png`, `preview-err.log`).

### 2026-07-20 — Auto-refresh elegante con pausa en background + freshness badge

**Objetivo**: eliminar la necesidad de que el usuario refresque a mano para ver datos actualizados.

**Hecho**:
- Refactor de la sección "Auto-refresh" en `src/main.ts:290-371`:
  - `tickRefresh({manual})` reporta errores (`pollErrors++` → toast a partir de 3 fallos seguidos), feedback positivo en refresh manual ("Datos ya están al día"),estado visible del botón (loading spinner via `.loading`, success verde 1.5s).
  - `fmtFreshness(diffMs)`: "hace 23s" / "hace 5m 04s" / "hace 2h 15m" — swiss, mono, discreto.
  - `updateFreshness()`: pinta `#datos-freshness` cada 1s; verde si <2min (`fresh`), ámbar si >7min (`stale`).
  - `startPolling()` / `stopPolling()`: separa el `setInterval` para pausar/reanudar. Pausa el countdown cuando `document.hidden`.
  - `visibilitychange` listener: al volver al tab, refresh inmediato si hace >5s del último poll; reanuda reloj y freshness.
  - Botón `#refresh-now` en masthead (SVG circular arrow, 34px, mismo estilo que `#theme-toggle`) — click → `tickRefresh({manual:true})`. Spin CSS en `.loading`, borde verde en `.success`.
  - Refresh del `applyNewData()` ahora también llama `updateFreshness()`.
  - Fix de yapa: agregado `import type { LegendMode }` en `src/main.ts:59` (TS error preexistente en línea 160).
- `index.html:30-38`: agregado `<button id="refresh-now">` con SVG y `<span id="datos-freshness">` en `.live-wrap`.
- `src/style.css:247-290`: estilos de `#refresh-now` (mismo token que `#theme-toggle`, borde 1px, hover invert), `@keyframes spin`, `.success` verde;`.live-freshness` mono 10.5px, `.fresh`/`.stale`.
- Smoke test OK (carga + search + radio + hexbin + hover + nearest). Build OK. Typecheck OK.

**Decidido**:
- **Sin WebSocket/SSE**: GitHub Pages es estático; agregar backend (CF Worker/Worker+Durable) implica exponer datos a otra infra y rompe el 100% client-side. Polling cada 60s es suficiente (Enel republica cada ~5 min).
- **Pausar polling en background** (`document.hidden`): ahorra battery + requests inútiles a Pages, pero el reloj sigue andando para no romper la sensación de "live".
- **Refresh on-visibilidad**: si el usuario vuelve al tab después de 10 min, se actualiza al instante sin esperar al próximo tick (la causa #1 de "tengo que apretar F5").
- **Freshness badge en lugar de más toasts**: feedback continuo, sutil, sin interrumpir. Verde (<2min) / gris neutro / ámbar (>7min) — mismo token de severidad que el resto del sitio.
- **Toast más expresativo en update real**: "Datos actualizados ✓ — DD/MM HH:mm" en vez de solo timestamp.
- **No sonidos**: rompen flujo de análisis.
- **Errores dejan de ser silenciosos**: a partir de 3 fallos seguidos, toast "Sin conexión al espejo (N intentos fallidos)". El usuario sabe que no está viendo datos frescos por una razón, no porque se olvidó de F5.

**Bloqueantes / pendientes**:
- Ninguno. Smoke test pasó limpio. Errores en log del smoke son tiles OpenFreeMap intermitentes (preexistente, no relacionado).

**Próxima sesión**:
- Sanity check en producción (https://geoidegeoidal.github.io/luz-rm/) post-deploy: verificar que el badge "hace Xs" arranque verde, que el spin del botón funcione, y que volviendo de un tab inactivo >10min se dispare el refresh solo.
- Si se observa que el toast de "actualizado" es molesto en sesiones largas con updates cada 5min, considerar bajarlo a solo flash de la barra + badge verde (sin toast).

**Commits relevantes**: pendiente commit (usuario no pidió commit explícito). Cambios en `index.html`, `src/style.css`, `src/main.ts`.

### 2026-07-19 — Build completo + mobile + fixes de UI + deduplicación incidencias

**Objetivo**: construir el visor ENEL·LUZ end-to-end y dejarlo deployado en
GitHub Pages.

**Hecho** (commits no-data, orden cronológico ascendente):
- `26cc97d` Initial commit (esqueleto Vite + TS + MapLibre basemap)
- `dd95d5f` UI: colored analysis tools and new search button
- `4b56e1c` docs: update README with screenshots and features
- `ef8d5c1` fix: add missing glyphs to satellite style
- `524dec2` feat: align chart severity colors with map and add inline legend
- `84fd7d4` fix: trigger deploy on data commits to update github pages
- `c1b9679` docs: update AGENTS.md with github pages deployment catch
- `8f8c254` feat: responsive mobile layout
- `c209e06` chore: add mobile screenshot script
- `ad0b0a5` fix: mobile scroll and auto-collapse toolbar
- `bf0a5c1` fix: prevent toolbar from overlapping map legend on mobile
- `4b19c59` fix: raise toolbar z-index above map legend
- `cb80447` fix: trigger deploy workflow on data update
- `5173154` fix: deduplicate incidencias logic to prevent massive data inflation
- `7ba32cf` feat: add subtle layer descriptions to toolbar
- `70d707f` fix: stack legends when both comunas and densidad are active

**Decidido**:
- Stack visual: flat design suizo, paper+tinta, sin gradientes/sombras. UI
  clara (light/dark mode), mapa como viewport oscuro. Estética "AI slop"
  genérica explícitamente rechazada.
- Espejo de datos con GitHub Actions (cron `*/5 * * * *`) en vez de proxy
  server propio: Enel no manda CORS, los JSON planos se espejan a
  `public/data/` y cada commit re-dispara deploy a Pages.
- Bug crítico de `INCIDENCIA` resuelto: no sumar `CLITOTAL` entre trafos
  del mismo evento (ya trae el total). Ver `AGENTS.md` § Trampa 5.
- GitHub Pages con Vite **requiere rebuild completo** en cada commit de
  datos: el action `deploy-pages` sirve solo `dist/`, no JSON sueltos. Ver
  `AGENTS.md` § Trampa 9.
- Sin alimentadores: la capa remota casi siempre da 404, código tolera null.
- Sin snapshots históricos: decidido no implementar para repo liviano.

**Bloqueantes / pendientes**:
- Ninguno activo. El visor está deployado y los updates de datos corren
  cada 5 min automáticamente.

**Próxima sesión**:
- Sanity check del deploy de Pages.
- Si hay feedback de uso, considerar: web workers para parse de avisos
  (si el GeoJSON de ~2.2 MB empieza a doler en mobile), service worker
  offline, o mejor manejo de `alimentadores` si Enel los vuelve a servir.

**Commits relevantes**: todos los listados arriba; el más reciente
no-data es `70d707f` (2026-07-19).
