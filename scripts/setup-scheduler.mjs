import { pathToFileURL } from 'node:url'

const REPO_URL = 'https://api.github.com/repos/geoidegeoidal/luz-rm'
const DISPATCH_URL = `${REPO_URL}/actions/workflows/update-data.yml/dispatches`
const JOBS_URL = 'https://api.cron-job.org/jobs'

export async function setupScheduler({ cronApiKey, githubToken }, fetcher = fetch) {
  if (!cronApiKey?.trim() || !githubToken?.startsWith('github_pat_')) {
    throw new Error('Configura CRON_JOB_API_KEY y un GITHUB_DISPATCH_TOKEN fine-grained en .env.local')
  }

  async function request(url, token, method = 'GET', body) {
    let response
    try {
      response = await fetcher(url, {
        method,
        redirect: 'error',
        signal: AbortSignal.timeout(20_000),
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'luz-rm-scheduler-setup',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch {
      // No imprimir errores del proveedor: pueden contener credenciales.
      throw new Error(`No se pudo conectar con ${new URL(url).hostname}; comprueba el estado antes de reintentar`)
    }
    if (!response.ok) throw new Error(`${new URL(url).hostname}: HTTP ${response.status}`)
    return response
  }

  async function readJson(response) {
    try {
      return await response.json()
    } catch {
      throw new Error('Respuesta JSON invalida del proveedor; comprueba la tarea antes de reintentar')
    }
  }

  const repo = await readJson(await request(REPO_URL, githubToken))
  if (repo.private !== false || repo.default_branch !== 'main') {
    throw new Error('La instalacion requiere luz-rm publico y con main como rama principal')
  }

  const listing = await readJson(await request(JOBS_URL, cronApiKey))
  if (listing.someFailed || !Array.isArray(listing.jobs)) {
    throw new Error('Listado incompleto de cron-job.org; no se creara una tarea duplicada')
  }
  const matches = listing.jobs.filter(job => job.url === DISPATCH_URL)
  if (matches.length > 1) throw new Error('Hay varias tareas para este espejo; deja solo una en cron-job.org')
  const existing = matches[0]
  if (existing && (!Number.isSafeInteger(existing.jobId) || existing.jobId <= 0)) {
    throw new Error('Identificador de tarea invalido')
  }

  // Verificar Actions:write con una actualizacion real antes de almacenar el token externo.
  await request(DISPATCH_URL, githubToken, 'POST', { ref: 'main' })
  const job = {
    title: 'LUZ RM - actualizar datos cada 5 minutos',
    url: DISPATCH_URL,
    enabled: true,
    saveResponses: false,
    requestMethod: 1, // POST en la API de cron-job.org.
    requestTimeout: 20,
    redirectSuccess: false,
    schedule: {
      timezone: 'UTC', expiresAt: 0,
      hours: [-1], mdays: [-1], months: [-1], wdays: [-1],
      minutes: [1, 6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56],
    },
    notification: { onFailure: true, onFailureCount: 3, onSuccess: false, onDisable: true },
    extendedData: {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'luz-rm-scheduler',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  }
  const response = await request(
    existing ? `${JOBS_URL}/${existing.jobId}` : JOBS_URL,
    cronApiKey, existing ? 'PATCH' : 'PUT', { job },
  )
  const jobId = existing?.jobId ?? (await readJson(response)).jobId
  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    throw new Error('Respuesta inesperada; comprueba la tarea en cron-job.org antes de reintentar')
  }
  return jobId
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  setupScheduler({
    cronApiKey: process.env.CRON_JOB_API_KEY,
    githubToken: process.env.GITHUB_DISPATCH_TOKEN,
  }).then(jobId => {
    console.log(`[scheduler] Tarea ${jobId} configurada cada 5 min; prueba inicial enviada a GitHub`)
  }).catch(error => {
    console.error(`[scheduler] ${error.message}`)
    process.exitCode = 1
  })
}
