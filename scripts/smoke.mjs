/* Smoke test con Chrome real via CDP: carga, interacciones y screenshot */
import puppeteer from 'puppeteer-core'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PAGE_URL = process.argv[2] ?? 'http://localhost:4173/'
const SHOT = process.argv[3] ?? 'C:\\Users\\Tokyotech\\AppData\\Local\\Temp\\opencode\\smoke.png'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--window-size=1680,1000'],
  defaultViewport: { width: 1680, height: 1000 },
})
const page = await browser.newPage()
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url().slice(0, 110)} ${r.failure()?.errorText}`))
await page.setRequestInterception(true)
page.on('request', (request) => {
  const url = request.url()
  if (url.startsWith('https://photon.komoot.io/api/') && url.includes('Apoquindo')) {
    void request.respond({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-73.25, -39.81] },
            properties: { name: 'Apoquindo fuera de RM', city: 'La Union' },
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-70.57, -33.41] },
            properties: {
              name: 'Apoquindo 4500',
              district: '<img src=x onerror="window.__xss=1">',
              city: 'Las Condes',
            },
          },
        ],
      }),
    })
  } else {
    void request.continue()
  }
})

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const assert = (condition, message) => {
  if (!condition) throw new Error(`[smoke] ${message}`)
}

await page.goto(PAGE_URL, { waitUntil: 'networkidle2', timeout: 60_000 })

// 1) esperar render completo
const t0 = Date.now()
let ready = false
while (Date.now() - t0 < 30_000) {
  ready = await page.evaluate(
    () => document.querySelectorAll('#panel-charts canvas').length >= 4 && !!window.__mapDebug,
  )
  if (ready) break
  await sleep(500)
}
console.log('ready:', ready)
assert(ready, 'la aplicación no alcanzó el estado listo')
await sleep(2500)

const identity = await page.evaluate(() => ({
  brand: document.querySelector('.brand-name')?.textContent?.trim(),
  title: document.title,
  footer: document.querySelector('#footer')?.textContent ?? '',
  notice: document.querySelector('#footer a')?.getAttribute('href') ?? '',
}))
assert(identity.brand === 'LUZ·RM', 'la marca neutral no aparece en el masthead')
assert(identity.title.startsWith('LUZ·RM'), 'el titulo del documento conserva la marca anterior')
assert(
  identity.footer.includes('ENEL SOLO IDENTIFICA LA FUENTE') &&
    identity.notice.endsWith('/NOTICE.md'),
  'el aviso de procedencia o el enlace legal no estan visibles',
)

const mapState = await page.evaluate(() => window.__mapDebug?.())
console.log('mapState.rendered:', mapState?.rendered, '| comunas:', mapState?.comunasRendered)
assert(mapState?.layers?.includes('ly-comunas-fill'), 'faltan capas de datos')
const indicatorGuide = await page.evaluate(() => ({
  definitions: document.querySelectorAll('#ops-guide .ops-definition').length,
  text: document.querySelector('#ops-guide')?.textContent ?? '',
  method: document.querySelector('#ops-guide .ops-method')?.textContent ?? '',
}))
assert(indicatorGuide.definitions === 6, 'la guia no define los seis indicadores operativos')
assert(
  indicatorGuide.text.includes('PRESION 60M') &&
    indicatorGuide.text.includes('ETA VENCIDAS') &&
    indicatorGuide.method.includes('deduplicado por ID'),
  'la guia de indicadores esta incompleta',
)

// 2) cross-filter: una comuna gobierna contexto, mapa y panel; luego se puede limpiar
await page.evaluate((nombre) => window.__selectComunaDebug?.(nombre), mapState?.firstComuna)
await sleep(900)
const scoped = await page.evaluate(() => ({
  selected: window.__mapDebug?.().selectedComuna,
  visible: window.__mapDebug?.().visibleSummary,
  label: document.querySelector('#scope-label')?.textContent?.trim(),
  clearVisible: !document.querySelector('#scope-clear')?.classList.contains('hidden'),
  chartCount: document.querySelectorAll('#panel-charts canvas').length,
}))
assert(scoped.selected === mapState?.firstComuna, 'la comuna no quedo seleccionada')
assert(
  scoped.label?.includes(mapState?.firstComuna?.replaceAll('_', ' ')),
  'el contexto no refleja la comuna',
)
assert(scoped.clearVisible, 'no se ofrecio restaurar la vista RM')
assert(scoped.visible?.comunas === 1, 'el alcance no se limito a una comuna')
assert(scoped.visible?.avisos <= mapState?.visibleSummary?.avisos, 'aumentaron avisos al filtrar')
assert(scoped.visible?.eventos <= mapState?.visibleSummary?.eventos, 'aumentaron eventos al filtrar')
assert(scoped.chartCount === 4, 'los graficos desaparecieron durante el cross-filter')
await page.click('#scope-clear')
await sleep(500)
const restored = await page.evaluate(() => window.__mapDebug?.())
assert(restored?.selectedComuna === null, 'el cross-filter no se limpio')
assert(
  restored?.visibleSummary?.avisos === mapState?.visibleSummary?.avisos &&
    restored?.visibleSummary?.eventos === mapState?.visibleSummary?.eventos,
  'la vista RM no restauro sus conteos',
)

// 3) reporte regional y comunal: mismo alcance, dos paginas y mapa operacional
await page.click('#report-open')
await page.waitForSelector('#report-root')
const regionalReport = await page.evaluate(() => ({
  pages: document.querySelectorAll('#report-root .report-page').length,
  scope: document.querySelector('#report-root .report-meta')?.textContent,
  comunaPaths: document.querySelectorAll('#report-root .report-map-comuna').length,
  operationalGroups: document.querySelectorAll(
    '#report-root .report-map-incidencia-markers, #report-root .report-map-avisos',
  ).length,
  mapLegend: document.querySelector('#report-root .report-map-legend')?.textContent,
  printLabel: document.querySelector('#report-print')?.textContent?.trim(),
  brand: document.querySelector('#report-root .report-brand strong')?.textContent?.trim(),
  disclaimer: document.querySelector('#report-root .report-foot')?.textContent ?? '',
}))
assert(regionalReport.pages === 2, 'el reporte RM no tiene dos paginas')
assert(regionalReport.scope?.includes('RM'), 'el reporte RM no declara su alcance')
assert(regionalReport.comunaPaths > 0, 'el reporte RM no genero mapa vectorial')
assert(
  regionalReport.operationalGroups === 2 &&
    regionalReport.mapLegend?.includes('incidencia') &&
    regionalReport.mapLegend?.includes('aviso'),
  'el mapa del reporte no incluye sus capas operacionales',
)
assert(
  regionalReport.printLabel === 'IMPRIMIR / GUARDAR PDF',
  'el reporte no ofrece exportacion PDF',
)
assert(
  regionalReport.brand === 'LUZ·RM' &&
    regionalReport.disclaimer.includes('ENEL SOLO IDENTIFICA LA FUENTE'),
  'el reporte no usa la identidad neutral o no declara la procedencia',
)
await page.click('#report-close')
await page.evaluate((nombre) => window.__selectComunaDebug?.(nombre), mapState?.firstComuna)
await sleep(500)
await page.click('#report-open')
await page.waitForSelector('#report-root')
const communeReportScope = await page.evaluate(
  () => document.querySelector('#report-root .report-meta')?.textContent ?? '',
)
assert(
  communeReportScope.includes(mapState?.firstComuna?.replaceAll('_', ' ')),
  'el reporte comunal no conserva el alcance',
)
await page.click('#report-close')
await page.click('#scope-clear')
await sleep(400)

// 4) busqueda Photon: escribir y esperar resultados
await page.click('#search-input')
await page.type('#search-input', 'Apoquindo 4500', { delay: 25 })
let searchOk = false
try {
  await page.waitForSelector('#search-results .sr-item', { timeout: 8000 })
  searchOk = true
} catch {
  console.log('search: sin resultados a tiempo')
}
if (searchOk) {
  const safeSearchDom = await page.evaluate(
    () => !document.querySelector('#search-results img') && !window.__xss,
  )
  assert(safeSearchDom, 'el geocoder inyectó HTML en los resultados')
  await page.click('#search-results .sr-item')
  await sleep(1500)
}
const affected = await page.evaluate(
  () => document.querySelector('#analysis-body .verdict')?.textContent?.trim() ?? 'sin verdict',
)
console.log('search:', searchOk, '| verdict:', affected)
assert(searchOk, 'el buscador no devolvió resultados')
const searchState = await page.evaluate(() => window.__mapDebug?.())
const [lon, lat] = searchState?.center ?? []
assert(
  lon >= -71.45 && lon <= -70.2 && lat >= -33.95 && lat <= -33.1,
  `la búsqueda salió de la RM: ${lon},${lat}`,
)

// 5) herramienta "Mas cercana": armar y click en centro del mapa
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#analysis-tools button')]
  btns.find((b) => b.textContent.includes('Mas cercana'))?.click()
})
await sleep(400)
await page.mouse.click(700, 500)
await sleep(1500)
const nearest = await page.evaluate(
  () => document.querySelector('#analysis-body .verdict')?.textContent?.trim() ?? 'sin verdict',
)
console.log('nearest verdict:', nearest)
assert(nearest.includes('INCIDENCIA MAS CERCANA'), 'la herramienta de incidencia cercana no respondió')

// 6) herramienta "Radio"
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('#analysis-tools button')]
  btns.find((b) => b.textContent.trim().startsWith('Radio'))?.click()
})
await sleep(400)
await page.mouse.click(700, 500)
await sleep(1500)
const radio = await page.evaluate(
  () => document.querySelector('#analysis-body .verdict')?.textContent?.trim() ?? 'sin verdict',
)
console.log('radio verdict:', radio)
assert(radio.includes('RADIO DE'), 'la herramienta de radio no respondió')

// 7) hexbin toggle
await page.evaluate(() => {
  document.querySelector('[data-eye="hexbin"]')?.click()
})
await sleep(1800)
const hex = await page.evaluate(() => window.__mapDebug?.())
console.log('hexbin rendered features:', hex?.rendered)
assert(hex?.hexbinVisibility === 'visible', 'la capa hexbin no quedó visible')

// 8) tema UI + reporte: el PDF usa SVG de impresion y foco aislado aun en dark
await page.click('#theme-toggle')
await sleep(400)
const darkMode = await page.evaluate(() => window.__mapDebug?.().uiMode)
assert(darkMode === 'dark', 'el modo oscuro de la UI no se aplicó')
await page.click('#report-open')
await page.waitForSelector('#report-root')
const darkReport = await page.evaluate(() => ({
  svgCount: document.querySelectorAll('#report-root .report-chart-svg').length,
  appInert: document.querySelector('#app')?.hasAttribute('inert'),
  activeId: document.activeElement?.id,
}))
assert(darkReport.svgCount === 2, 'el reporte no usa graficos SVG dedicados')
assert(darkReport.appInert, 'el dashboard no quedo inert bajo el dialogo')
assert(darkReport.activeId === 'report-print', 'el foco no entro al dialogo')
await page.keyboard.down('Shift')
await page.keyboard.press('Tab')
await page.keyboard.up('Shift')
const trappedFocus = await page.evaluate(() => document.activeElement?.id)
assert(trappedFocus === 'report-close', 'el foco no cicla dentro del dialogo')
await page.keyboard.press('Escape')
const reportClosed = await page.evaluate(() => ({
  root: !!document.querySelector('#report-root'),
  appInert: document.querySelector('#app')?.hasAttribute('inert'),
}))
assert(!reportClosed.root && !reportClosed.appInert, 'el dialogo no restauro la app')
await page.click('#theme-toggle')
await sleep(250)

// 9) aviso ciudadano: preparar y comprobar salida sin contactar a Enel/WhatsApp.
await page.evaluate(() => {
  window.__faultOutbound = []
  window.open = (...args) => { window.__faultOutbound.push(args); return null }
})
await page.click('#fault-report-open')
assert(await page.$eval('#fault-notice-dialog', el => el.open), 'el aviso no abrió un diálogo')
assert(await page.$eval('#fault-lat', el => Number(el.value) === -33.41), 'no reutilizó la ubicación buscada')
await page.focus('#fault-close')
await page.keyboard.down('Shift')
await page.keyboard.press('Tab')
await page.keyboard.up('Shift')
assert(await page.evaluate(() => !!document.activeElement?.closest('#fault-notice-dialog')), 'el foco salió del diálogo de aviso')
await page.type('#fault-description', 'PRUEBA LOCAL, NO ENVIAR. <img src=x onerror="window.__faultXss=1">')
await page.click('#fault-form button[type=submit]')
assert(await page.$eval('#fault-whatsapp', el => el.disabled), 'WhatsApp se habilitó sin consentimiento')
const draft = await page.$eval('#fault-message', el => el.value)
assert(draft.includes('sin afiliación con Enel'), 'el borrador omitió la independencia')
assert(draft.includes('-33.410000') && draft.includes('-70.570000'), 'el borrador perdió coordenadas')
assert(!await page.evaluate(() => window.__faultXss), 'texto de la descripción ejecutó HTML')
assert(await page.evaluate(() => window.__faultOutbound.length === 0), 'preparar transmitió el borrador')
await page.evaluate(() => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Permiso denegado en prueba') } } })
})
await page.click('#fault-copy')
assert(await page.$eval('#fault-status', el => el.textContent.includes('manualmente')), 'copiar sin permiso no ofreció recuperación')
await page.click('#fault-consent')
await page.click('#fault-whatsapp')
const outbound = await page.evaluate(() => window.__faultOutbound[0])
const outboundUrl = new URL(outbound[0])
assert(outboundUrl.origin === 'https://api.whatsapp.com' && outboundUrl.searchParams.get('phone') === '56994447606', 'destinatario no oficial')
assert(outboundUrl.searchParams.get('text') === draft, 'la salida difiere de la vista previa')
assert(outbound[2] === 'noopener,noreferrer', 'la salida no aisló el sitio externo')
await page.keyboard.press('Escape')
assert(await page.evaluate(() => document.activeElement?.id === 'fault-report-open'), 'cerrar no devolvió el foco')
await page.click('#fault-report-open')
assert(await page.$eval('#fault-whatsapp', el => el.disabled), 'reabrir reutilizó consentimiento antiguo')
assert(await page.$eval('#fault-description', el => el.value.includes('PRUEBA LOCAL')), 'cerrar perdió el borrador')
await page.click('#fault-pick')
await page.click('#draw-cancel')
assert(await page.$eval('#fault-description', el => el.value.includes('PRUEBA LOCAL')), 'cancelar selección perdió la descripción')
await page.click('#fault-pick')
await page.mouse.click(700, 500)
await page.waitForFunction(() => document.querySelector('#fault-notice-dialog').open)
assert(await page.$eval('#fault-address', el => el.value === ''), 'un punto nuevo conservó una dirección ajena')
await page.click('#fault-form button[type=submit]')
await page.focus('#fault-lat')
await page.keyboard.down('Control')
await page.keyboard.press('A')
await page.keyboard.up('Control')
await page.keyboard.press('Backspace')
await page.type('#fault-lat', '-40')
assert(await page.$eval('#fault-lat', el => el.value === '-40'), 'la prueba no ingresó la latitud inválida')
await page.click('#fault-form button[type=submit]')
assert(await page.$eval('#fault-error', el => el.textContent.includes('RM')), 'no rechazó la ubicación fuera de RM')
assert(await page.$eval('#fault-description', el => el.value.includes('PRUEBA LOCAL')), 'validación perdió el texto')
await page.focus('#fault-lat')
await page.keyboard.down('Control')
await page.keyboard.press('A')
await page.keyboard.up('Control')
await page.keyboard.press('Backspace')
await page.type('#fault-lat', '-33.412712')
await page.click('#fault-description', { clickCount: 3 })
await page.type('#fault-description', 'Ejemplo de prueba: sin suministro en el domicilio y casas cercanas. No enviar.')
await page.click('#fault-form button[type=submit]')
for (const width of [390, 320]) {
  await page.setViewport({ width, height: 844 })
  const fits = await page.$eval('#fault-notice-dialog', el => {
    const rect = el.getBoundingClientRect()
    return rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth + 1
  })
  assert(fits, `el aviso desborda a ${width}px`)
}
await page.screenshot({ path: SHOT.replace(/\.png$/, '-fault-mobile.png') })
await page.setViewport({ width: 1680, height: 1100 })
await page.$eval('#fault-notice-dialog', el => { el.scrollTop = 0 })
await page.screenshot({ path: SHOT.replace(/\.png$/, '-fault-desktop.png') })
await page.keyboard.press('Escape')
console.log('fault notice: consentimiento, borrador, mapa, URL y mobile OK; sin envíos reales')

await page.screenshot({ path: SHOT })
console.log('--- logs relevantes ---')
logs
  .filter((l) => !l.includes('ResizeObserver') && !l.includes('404'))
  .slice(0, 25)
  .forEach((l) => console.log(l))
await browser.close()
