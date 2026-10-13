import { isInsideRm } from '../geo/search'

export const ENEL_WHATSAPP_PHONE = '56994447606'
export const ENEL_CHANNELS_URL = 'https://www.enel.cl/es/clientes/emergencias/mapa-en-linea-cortes.html'
export const FAULT_TYPES = ['Sin suministro eléctrico', 'Suministro intermitente', 'Otra falla eléctrica'] as const
export type FaultLocation = { coordinates: [number, number]; address?: string }
export type FaultNotice = FaultLocation & { type: string; description: string }

export function buildFaultMessage(notice: FaultNotice, now = new Date()): string {
  const [lon, lat] = notice.coordinates
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || !isInsideRm([lon, lat])) {
    throw new Error('Elige una ubicación dentro del área RM del visor.')
  }
  if (!FAULT_TYPES.some(type => type === notice.type)) throw new Error('Selecciona un tipo de falla válido.')
  const description = notice.description.trim()
  const address = notice.address?.trim() || ''
  if (!description || description.length > 500) throw new Error('Describe la falla en 1 a 500 caracteres.')
  if (address.length > 160) throw new Error('La dirección o referencia admite hasta 160 caracteres.')
  const date = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago', dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23',
  }).format(now)
  return [
    'Hola, quiero reportar una falla de suministro a Enel Distribución Chile.',
    `Falla: ${notice.type}.`,
    `Descripción: ${description}`,
    address ? `Dirección o referencia declarada: ${address}` : 'Ubicación seleccionada en el mapa (sin dirección declarada).',
    `Coordenadas WGS84: latitud ${lat.toFixed(6)}, longitud ${lon.toFixed(6)}.`,
    `Mapa de ubicación: https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}`,
    `Fecha de preparación (Chile): ${date}.`,
    'Aviso preparado con LUZ·RM, proyecto independiente sin afiliación con Enel. Solicito continuar el registro por este canal oficial.',
  ].join('\n')
}

export function buildFaultWhatsAppUrl(message: string): string {
  return `https://api.whatsapp.com/send?phone=${ENEL_WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`
}

export function createFaultNotice(onPickPoint: () => void) {
  const dialog = document.createElement('dialog')
  dialog.id = 'fault-notice-dialog'
  dialog.setAttribute('aria-labelledby', 'fault-notice-title')
  dialog.setAttribute('aria-describedby', 'fault-notice-disclaimer')
  dialog.innerHTML = `
    <div class="fault-notice-head"><h2 id="fault-notice-title">AVISAR FALLA A ENEL</h2><button id="fault-close" type="button" aria-label="Cerrar aviso">CERRAR</button></div>
    <p id="fault-notice-disclaimer"><strong>LUZ·RM es un proyecto independiente, sin afiliación con Enel.</strong> Solo facilitamos preparar el aviso. El registro y su confirmación se completan con Enel.</p>
    <p class="fault-emergency">Riesgo eléctrico o electrodependencia: contacta directamente al <a href="tel:800800696">800 800 696</a>.</p>
    <form id="fault-form">
      <fieldset><legend>1 · UBICACIÓN DE LA FALLA</legend>
        <p>Usa la dirección buscada, elige un punto en el mapa o ingresa coordenadas. Verifica que tu suministro corresponda a Enel Distribución.</p>
        <button id="fault-pick" type="button">ELEGIR PUNTO EN EL MAPA</button>
        <label for="fault-address">Dirección o referencia (opcional)</label><input id="fault-address" type="text" maxlength="160" autocomplete="off" />
        <div class="fault-coordinate-grid">
          <div><label for="fault-lat">Latitud</label><input id="fault-lat" type="number" step="any" required placeholder="-33.45" /></div>
          <div><label for="fault-lon">Longitud</label><input id="fault-lon" type="number" step="any" required placeholder="-70.66" /></div>
        </div>
      </fieldset>
      <fieldset><legend>2 · QUÉ ESTÁ OCURRIENDO</legend>
        <label for="fault-type">Tipo de falla</label><select id="fault-type">${FAULT_TYPES.map(type => `<option>${type}</option>`).join('')}</select>
        <label for="fault-description">Descripción de lo que observas</label><textarea id="fault-description" rows="3" maxlength="500" required placeholder="Ej.: sin luz desde hace 20 minutos en mi domicilio y casas cercanas."></textarea>
        <p>Entrega tu número de cliente u otros datos personales directamente a Enel si los solicita.</p>
      </fieldset>
      <p id="fault-error" role="alert"></p>
      <button type="submit" class="primary">REVISAR MENSAJE</button>
    </form>
    <section id="fault-review" hidden aria-labelledby="fault-review-title">
      <h3 id="fault-review-title" tabindex="-1">3 · REVISA ANTES DE COMPARTIR</h3>
      <label for="fault-message">Mensaje preparado</label><textarea id="fault-message" rows="9" readonly></textarea>
      <label class="fault-consent"><input id="fault-consent" type="checkbox" /> Acepto compartir esta ubicación y descripción con WhatsApp/Meta al abrir el canal y con Enel al enviar el mensaje.</label>
      <div class="fault-notice-actions"><button id="fault-whatsapp" type="button" class="primary" disabled>ABRIR WHATSAPP DE ENEL</button><button id="fault-copy" type="button">COPIAR MENSAJE</button></div>
      <p>Abrir WhatsApp no envía ni registra el aviso: debes enviarlo allí, seguir las indicaciones y esperar la confirmación de Enel. El mensaje incluye un enlace de ubicación a Google Maps.</p>
    </section>
    <p id="fault-status" role="status"></p>
    <p class="fault-channel-source"><a href="${ENEL_CHANNELS_URL}" target="_blank" rel="noopener noreferrer">VER CANALES OFICIALES DE ENEL</a> · WhatsApp +56 9 9444 7606</p>`
  document.body.append(dialog)
  const element = <T extends HTMLElement>(id: string) => dialog.querySelector<T>(`#${id}`)!
  const form = element<HTMLFormElement>('fault-form')
  const preview = element<HTMLTextAreaElement>('fault-message')
  const consent = element<HTMLInputElement>('fault-consent')
  const whatsapp = element<HTMLButtonElement>('fault-whatsapp')
  const status = element<HTMLParagraphElement>('fault-status')
  const error = element<HTMLParagraphElement>('fault-error')
  let returnFocus: HTMLElement | null = null
  const invalidate = () => {
    element('fault-review').hidden = true
    consent.checked = false
    whatsapp.disabled = true
    preview.value = ''
    error.textContent = ''
    status.textContent = ''
  }
  const readNotice = (): FaultNotice => ({
    coordinates: [element<HTMLInputElement>('fault-lon').valueAsNumber, element<HTMLInputElement>('fault-lat').valueAsNumber],
    address: element<HTMLInputElement>('fault-address').value,
    type: element<HTMLSelectElement>('fault-type').value,
    description: element<HTMLTextAreaElement>('fault-description').value,
  })
  element('fault-close').onclick = () => dialog.close()
  dialog.addEventListener('close', () => returnFocus?.focus())
  // Mantener el recorrido de Tab dentro del formulario también en Chrome.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return
    const controls = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]')]
      .filter(control => control.getClientRects().length > 0)
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  })
  element('fault-pick').onclick = () => { dialog.close(); onPickPoint() }
  form.addEventListener('input', invalidate)
  form.addEventListener('change', invalidate)
  form.onsubmit = event => {
    event.preventDefault()
    try {
      preview.value = buildFaultMessage(readNotice())
      element('fault-review').hidden = false
      consent.checked = false
      whatsapp.disabled = true
      error.textContent = ''
      element('fault-review-title').focus()
    } catch (reason) {
      error.textContent = (reason as Error).message
    }
  }
  consent.onchange = () => { whatsapp.disabled = !consent.checked }
  whatsapp.onclick = () => {
    if (!consent.checked || !preview.value) return
    window.open(buildFaultWhatsAppUrl(preview.value), '_blank', 'noopener,noreferrer')
    status.textContent = 'Continúa en WhatsApp y espera la confirmación de Enel. Si no se abre, copia el mensaje y usa sus canales oficiales.'
  }
  element('fault-copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(preview.value)
      status.textContent = 'Mensaje copiado. Aún no se ha enviado a Enel.'
    } catch {
      preview.focus()
      preview.select()
      status.textContent = 'No se pudo copiar automáticamente. Selecciona el mensaje y cópialo manualmente.'
    }
  }
  const setLocation = (location: FaultLocation) => {
    element<HTMLInputElement>('fault-lon').value = location.coordinates[0].toFixed(6)
    element<HTMLInputElement>('fault-lat').value = location.coordinates[1].toFixed(6)
    element<HTMLInputElement>('fault-address').value = (location.address || '').slice(0, 160)
    invalidate()
  }
  return {
    setLocation,
    open() {
      consent.checked = false
      whatsapp.disabled = true
      returnFocus = document.activeElement === document.body
        ? document.getElementById('fault-report-open') : document.activeElement as HTMLElement | null
      dialog.showModal()
    },
  }
}
