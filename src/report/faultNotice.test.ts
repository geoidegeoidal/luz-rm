import { describe, expect, it } from 'vitest'
import { buildFaultMessage, buildFaultWhatsAppUrl, type FaultNotice } from './faultNotice'

const notice: FaultNotice = { coordinates: [-70.66, -33.45], address: 'Referencia de prueba', type: 'Sin suministro eléctrico', description: 'Falla de prueba, no enviar.' }

describe('aviso georreferenciado a Enel', () => {
  it('identifica ubicación WGS84 sin invertir latitud y longitud y declara independencia', () => {
    const message = buildFaultMessage(notice, new Date('2026-10-13T21:00:00Z'))
    expect(message).toContain('latitud -33.450000, longitud -70.660000')
    expect(message).toContain('maps?q=-33.450000,-70.660000')
    expect(message).toContain('proyecto independiente sin afiliación con Enel')
    expect(message).toContain('18:00')
    expect(message).not.toContain('reporte recibido')
  })
  it.each([[NaN, -33.45], [-70.66, Infinity], [-73.25, -39.81], [-33.45, -70.66]])('rechaza ubicaciones inválidas o fuera del área: %j', (lon, lat) => {
    expect(() => buildFaultMessage({ ...notice, coordinates: [lon, lat] })).toThrow('ubicación')
  })
  it('rechaza tipo y descripción inválidos sin inferir una falla del snapshot', () => {
    expect(() => buildFaultMessage({ ...notice, type: 'inventado' })).toThrow('tipo')
    expect(() => buildFaultMessage({ ...notice, description: '  ' })).toThrow('Describe')
    expect(() => buildFaultMessage({ ...notice, description: 'x'.repeat(501) })).toThrow('Describe')
  })
  it('codifica texto especial para el destinatario oficial sin permitir alterar la URL', () => {
    const message = buildFaultMessage({ ...notice, description: '<img src=x> & phone=123 # prueba\nSegunda línea' })
    const url = new URL(buildFaultWhatsAppUrl(message))
    expect(url.origin).toBe('https://api.whatsapp.com')
    expect(url.searchParams.get('phone')).toBe('56994447606')
    expect(url.searchParams.get('text')).toBe(message)
    expect(url.hash).toBe('')
  })
  it('no inventa una dirección cuando el usuario selecciona un punto', () => {
    expect(buildFaultMessage({ ...notice, address: '' })).toContain('sin dirección declarada')
  })
})
