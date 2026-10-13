import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setupScheduler } from './setup-scheduler.mjs'

const credentials = { cronApiKey: 'cron-secret-for-test', githubToken: 'github_pat_secret_for_test' }
const dispatchUrl = 'https://api.github.com/repos/geoidegeoidal/luz-rm/actions/workflows/update-data.yml/dispatches'
const publicRepo = { private: false, default_branch: 'main' }

function mockApi(responses) {
  const calls = []
  return {
    calls,
    fetcher: async (url, options) => {
      calls.push({ url, ...options })
      assert.equal(options.redirect, 'error')
      assert.ok(options.signal instanceof AbortSignal)
      const response = responses.shift()
      assert.ok(response, `Peticion inesperada: ${url}`)
      return response
    },
  }
}
const json = value => Response.json(value)

test('crea un programador de main y mantiene cada credencial en su servicio', async () => {
  const api = mockApi([json(publicRepo), json({ jobs: [], someFailed: false }), new Response(null, { status: 204 }), json({ jobId: 42 })])
  assert.equal(await setupScheduler(credentials, api.fetcher), 42)
  assert.equal(api.calls[0].headers.Authorization, `Bearer ${credentials.githubToken}`)
  assert.equal(api.calls[1].headers.Authorization, `Bearer ${credentials.cronApiKey}`)
  const dispatch = api.calls[2]
  assert.equal(dispatch.url, dispatchUrl)
  assert.equal(dispatch.method, 'POST')
  assert.deepEqual(JSON.parse(dispatch.body), { ref: 'main' })
  const creation = api.calls[3]
  assert.equal(creation.url, 'https://api.cron-job.org/jobs')
  assert.equal(creation.method, 'PUT')
  assert.equal(creation.headers.Authorization, `Bearer ${credentials.cronApiKey}`)
  const { job } = JSON.parse(creation.body)
  assert.equal(job.url, dispatchUrl)
  assert.equal(job.requestMethod, 1)
  assert.equal(job.enabled, true)
  assert.equal(job.saveResponses, false)
  assert.deepEqual(JSON.parse(job.extendedData.body), { ref: 'main' })
  assert.equal(job.extendedData.headers.Authorization, `Bearer ${credentials.githubToken}`)
  assert.equal(job.schedule.minutes.length, 12)
  for (let i = 0; i < 12; i++) {
    assert.equal((job.schedule.minutes[(i + 1) % 12] - job.schedule.minutes[i] + 60) % 60, 5)
  }
})

test('repetir la instalacion actualiza la misma tarea, sin duplicarla', async () => {
  const api = mockApi([
    json(publicRepo), json({ jobs: [{ jobId: 42, url: dispatchUrl }, { jobId: 99, url: 'https://example.com/' }] }),
    new Response(null, { status: 204 }), json({}),
  ])
  assert.equal(await setupScheduler(credentials, api.fetcher), 42)
  assert.equal(api.calls[3].method, 'PATCH')
  assert.equal(api.calls[3].url, 'https://api.cron-job.org/jobs/42')
})

test('rechaza credenciales ausentes o tokens clasicos antes de usar la red', async () => {
  for (const invalid of [{}, { ...credentials, cronApiKey: ' ' }, { ...credentials, githubToken: 'ghp_classic' }]) {
    await assert.rejects(setupScheduler(invalid, () => assert.fail('No debe contactar servicios')), /fine-grained/)
  }
})

test('rechaza repositorios privados o una rama principal distinta antes de activar nada', async () => {
  for (const repo of [{ private: true, default_branch: 'main' }, { private: false, default_branch: 'other' }]) {
    const api = mockApi([json(repo)])
    await assert.rejects(setupScheduler(credentials, api.fetcher), /publico/)
    assert.equal(api.calls.length, 1)
  }
})

test('un listado incompleto, duplicado o con ID invalido no activa ni crea tareas', async () => {
  for (const listing of [
    { jobs: [], someFailed: true }, {},
    { jobs: [{ jobId: 1, url: dispatchUrl }, { jobId: 2, url: dispatchUrl }] },
    { jobs: [{ jobId: '../otro', url: dispatchUrl }] },
  ]) {
    const api = mockApi([json(publicRepo), json(listing)])
    await assert.rejects(setupScheduler(credentials, api.fetcher))
    assert.equal(api.calls.length, 2)
  }
})

test('un token sin Actions:write no se almacena en cron-job.org', async () => {
  const api = mockApi([json(publicRepo), json({ jobs: [] }), new Response(credentials.githubToken, { status: 403 })])
  await assert.rejects(setupScheduler(credentials, api.fetcher), error => {
    assert.match(error.message, /HTTP 403/)
    assert.ok(!error.message.includes(credentials.githubToken))
    return true
  })
  assert.equal(api.calls.length, 3)
})

test('errores de transporte y JSON no filtran secretos del proveedor', async () => {
  await assert.rejects(setupScheduler(credentials, async () => { throw new Error(credentials.cronApiKey) }), error => {
    assert.ok(!error.message.includes(credentials.cronApiKey))
    return true
  })
  const api = mockApi([new Response(`no JSON: ${credentials.githubToken}`)])
  await assert.rejects(setupScheduler(credentials, api.fetcher), error => {
    assert.match(error.message, /JSON invalida/)
    assert.ok(!error.message.includes(credentials.githubToken))
    return true
  })
})
