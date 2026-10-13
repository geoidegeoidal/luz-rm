# Actualizacion gratuita del espejo

El 13/10/2026 se observaron 35 ejecuciones de `update-data.yml` desde el 6 de
octubre, con intervalos entre 2 h 43 min y 9 h 26 min (mediana: 5 h 44 min),
aunque el cron solicitaba cada 5 minutos. La ultima descarga duro 3 segundos y
el flujo completo 85 segundos. El cuello de botella observado es el disparador
`schedule`, no la descarga de Enel.

## Solucion y costo

[cron-job.org](https://cron-job.org/en/) activa el workflow existente cada 5
minutos por HTTPS. El servicio ofrece gratuitamente esta frecuencia y peticiones
POST con cabeceras y cuerpo propios. La API de administracion tiene una cuota
gratuita de 100 peticiones/dia; el instalador utiliza dos, y esa cuota no es la
frecuencia de las ejecuciones programadas.

GitHub ofrece [runners estandar gratuitos para repositorios publicos](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
Se conservan `ubuntu-latest`, Pages y el espejo existente; no se contrata un
backend, almacenamiento ni runner de pago. El instalador y el job de descarga
rechazan un repositorio privado. No cambiar el repositorio a privado ni aumentar
las cuotas de almacenamiento/cache con facturacion habilitada si se quiere
conservar esta condicion de costo cero.

El deploy elimina su propio artefacto temporal solo despues de publicar con
exito, para evitar acumular cientos de copias de `dist` por dia. Los artefactos
de ejecuciones fallidas/canceladas expiran en un dia; no se borran archivos del
repositorio ni el sitio ya publicado. El permiso Actions:write del GITHUB_TOKEN
se concede al job de deploy para esta limpieza, no al job de descarga.

El cron de GitHub queda como respaldo, desplazado fuera del minuto cero.
`concurrency: update-data` serializa descarga y deploy. Solo se publica cuando
cambia el snapshot; cada publicacion sigue necesitando reconstruir Pages.
La aplicacion mantiene su consulta al espejo cada 60 segundos.

Objetivo inicial: aproximadamente 6-8 minutos desde la publicacion de Enel.
Es una estimacion a verificar, no una garantia: siguen existiendo colas de
runners, propagacion de Pages, disponibilidad del programador y demora de Enel.

## Activacion con instalador

1. Crear una cuenta gratuita en [cron-job.org](https://console.cron-job.org/)
   y verificar el correo. Activar MFA desde su consola.
2. En GitHub, [crear un personal access token fine-grained](https://github.com/settings/personal-access-tokens/new)
   con nombre `luz-rm-scheduler`, titular `geoidegeoidal`, acceso a **Only select
   repositories -> luz-rm** y solo **Repository permissions -> Actions -> Read
   and write**. Metadata de lectura es automatico. No conceder Contents ni usar
   un token clasico, el token de `gh auth` o uno de otros proyectos. Elegir una
   caducidad (por ejemplo 90 dias) y recordar renovarlo antes de esa fecha.
3. En cron-job.org, **Settings -> API key**, crear una clave de administracion.
   Esta clave solo se usa durante la instalacion; restringirla a la IP propia
   si es estable y revocarla despues de verificar la tarea.
4. Copiar `docs/scheduler-keys.example.txt` a `.env.local` y completar ambas claves desde
   el editor, fuera del chat. `.env.local` ya esta ignorado por Git. Las variables
   no llevan prefijo `VITE_` y no se incluyen en el sitio publico.
5. Con Node >=20.6, ejecutar desde el proyecto:

   ```bash
   npm run setup-scheduler
   ```

El instalador comprueba que el repositorio sea publico, consulta las tareas
existentes, envia una prueba real a `update-data.yml` en `main` para verificar
Actions:write y crea/actualiza la tarea. Repetirlo renueva el token de la misma
tarea; no crea duplicados. No imprime claves ni cuerpos de respuesta.
La prueba inicial usa el workflow que ya este publicado en `main`.

La tarea queda habilitada a los minutos 1, 6, 11, ... 56 de cada hora UTC.
Se desactiva guardar respuestas y se configuran avisos tras tres errores o si
la tarea se deshabilita. El token de GitHub **queda almacenado en cron-job.org**
para enviar las peticiones. Este servicio debe considerarse un custodio de la
credencial: el permiso Actions:write permite activar/cancelar workflows de este
repositorio, no escribir su codigo. El prefijo fine-grained se valida localmente;
el alcance exacto debe configurarlo el titular al crear el token.

Si una peticion falla o expira, comprobar la consola antes de reintentar: una
operacion podria haberse completado aunque no llegase su respuesta.

## Activacion desde la consola, sin API key de administracion

Tambien se puede crear la misma tarea directamente en la consola. Solo requiere
el PAT de GitHub del paso 2 anterior; no hace falta una API key de cron-job.org.

- Titulo: `LUZ RM - actualizar datos cada 5 minutos`.
- URL: `https://api.github.com/repos/geoidegeoidal/luz-rm/actions/workflows/update-data.yml/dispatches`.
- Horario personalizado: `1-59/5 * * * *`; no guardar respuestas ni fijar expiracion
  de la tarea (la credencial si tiene caducidad).
- Avanzado: metodo `POST`, cuerpo `{"ref":"main"}`, timeout 20 segundos,
  redirecciones no consideradas exitosas y autenticacion HTTP basica desactivada.
- Cabeceras: `Content-Type: application/json`,
  `Accept: application/vnd.github+json`, `User-Agent: luz-rm-scheduler` y
  `Authorization: Bearer <PAT restringido>`.
- Avisar tras tres fallos y si la tarea se deshabilita; sin aviso en cada exito.

Hacer una ejecucion de prueba, comprobar el workflow en GitHub y guardar la
tarea habilitada. Si mas adelante se usa el instalador, encontrara esta misma
tarea por su URL y la actualizara sin duplicarla.

## Verificacion en produccion

1. En **Actions -> update-data**, comprobar una ejecucion `workflow_dispatch`
   exitosa de la prueba inicial y varias ejecuciones posteriores cada 5 minutos.
   Una respuesta HTTP exitosa del programador solo confirma el disparo, no que
   la descarga y el deploy hayan terminado correctamente.
2. Comparar el campo `datos` de
   [Enel](https://mapaemergencia.enel.com/galeria/documento/me-capa-estado.txt)
   con el espejo en `public/data/estado.json` y con
   [Pages](https://geoidegeoidal.github.io/luz-rm/data/estado.json).
3. Verificar que los deploys siguen ocurriendo solo al cambiar los datos y que
   la interfaz conserva filtros y la hora DATOS al refrescar.
4. Borrar `.env.local` y revocar la API key de administracion de cron-job.org
   una vez completada la configuracion. El PAT de GitHub debe seguir vigente.

Para detener el programador, deshabilitar la tarea en cron-job.org y revocar el
PAT de GitHub. El cron de respaldo sigue operativo. Una averia de Enel o GitHub
no se resuelve aumentando indefinidamente la frecuencia.

Referencias: [API de cron-job.org](https://docs.cron-job.org/rest-api.html),
[API workflow_dispatch](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event),
[limitaciones de schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
