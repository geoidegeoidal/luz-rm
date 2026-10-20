import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const deploy = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8').replaceAll('\r\n', '\n')
const update = readFileSync(new URL('../.github/workflows/update-data.yml', import.meta.url), 'utf8').replaceAll('\r\n', '\n')

// Comprueba el cableado de Actions sin publicar ni contactar GitHub Pages.
function step(marker) {
  const start = deploy.indexOf(`      - ${marker}\n`)
  assert.notEqual(start, -1, `Falta el paso ${marker}`)
  const next = deploy.indexOf('\n      - ', start + 1)
  return deploy.slice(start, next < 0 ? undefined : next)
}

test('Pages espera la publicacion activa en vez de cancelarla', () => {
  assert.match(deploy, /concurrency:\n  group: pages\n  cancel-in-progress: false/)
})

test('la publicacion tiene dos intentos oficiales y solo el primero tolera errores', () => {
  const first = step('id: deployment')
  const retry = step('id: deployment_retry')
  assert.equal((deploy.match(/uses: actions\/deploy-pages@v4/g) ?? []).length, 2)
  for (const attempt of [first, retry]) {
    assert.match(attempt, /uses: actions\/deploy-pages@v4/)
    assert.match(attempt, /timeout: 1200000/)
  }
  assert.match(first, /continue-on-error: true/)
  assert.match(retry, /if: \$\{\{ steps\.deployment\.outcome == 'failure' \}\}/)
  assert.doesNotMatch(retry, /continue-on-error/)
})

test('solo espera tras un fallo y limita el tiempo total', () => {
  const pause = step('name: Esperar antes de reintentar Pages')
  assert.match(pause, /if: \$\{\{ steps\.deployment\.outcome == 'failure' \}\}/)
  assert.match(pause, /run: sleep 120/)
  assert.match(deploy, /  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    timeout-minutes: 45/)
  assert.ok(deploy.indexOf('id: deployment') < deploy.indexOf('name: Esperar antes de reintentar Pages'))
  assert.ok(deploy.indexOf('name: Esperar antes de reintentar Pages') < deploy.indexOf('id: deployment_retry'))
})

test('conserva la URL exitosa y elimina el artefacto solo tras publicar', () => {
  assert.match(deploy, /url: \$\{\{ steps\.deployment\.outputs\.page_url \|\| steps\.deployment_retry\.outputs\.page_url \}\}/)
  const cleanup = step('name: Eliminar artefacto temporal tras publicar')
  assert.match(cleanup, /if: \$\{\{ steps\.deployment\.outcome == 'success' \|\| steps\.deployment_retry\.outcome == 'success' \}\}/)
  assert.match(cleanup, /PAGES_ARTIFACT_ID: \$\{\{ needs\.build\.outputs\.pages_artifact_id \}\}/)
  assert.match(cleanup, /gh api --method DELETE "repos\/\$GITHUB_REPOSITORY\/actions\/artifacts\/\$PAGES_ARTIFACT_ID"/)
})

test('mantiene compilacion, llamadas existentes, permisos y cron de descarga', () => {
  assert.match(deploy, /  push:\n    branches: \[main\]\n  workflow_dispatch:\n  workflow_call:/)
  assert.match(deploy, /ref: \$\{\{ github\.ref_name \}\}/)
  assert.match(deploy, /- run: npm ci\n\s+- run: npm run build/)
  assert.match(deploy, /uses: actions\/upload-pages-artifact@v3/)
  assert.match(deploy, /retention-days: 1/)
  assert.match(deploy, /    permissions:\n      contents: read\n      actions: write\n      pages: write\n      id-token: write/)
  assert.match(update, /cron: '2-59\/5 \* \* \* \*'/)
  assert.match(update, /if: needs\.fetch\.outputs\.changed == 'true'/)
  assert.match(update, /uses: \.\/\.github\/workflows\/deploy\.yml/)
})
