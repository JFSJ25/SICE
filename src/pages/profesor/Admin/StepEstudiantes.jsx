import { useState } from 'react'
import { supabase } from '../../../lib/supabase.js'
import {
  matricularEstudiantes,
  obtenerHemisemestres
} from '../../../lib/data.js'
import {
  descargarTexto,
  importarEstudiantes,
  serializarCSVCredenciales
} from '../../../lib/importarEstudiantes.js'
import { Panel, Button, Aviso, Spinner } from '../../../components/ui/index.jsx'
import { SelectorParalelo } from './StepParalelo.jsx'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

function normalizarCuentas(data) {
  const filas = Array.isArray(data)
    ? data
    : (data?.creados ??
      data?.creadas ??
      data?.cuentas ??
      data?.credenciales ??
      data?.resultados ??
      data?.usuarios_creados ??
      data?.usuarios ??
      data?.created ??
      data?.data ??
      data?.personas ??
      [])

  return filas.map(f => {
    const usuario = f.usuario ?? f.user ?? f.cuenta ?? {}
    return {
      ...f,
      id: f.id ?? f.usuario_id ?? usuario.id ?? usuario.usuario_id,
      nombre_completo:
        f.nombre_completo ?? f.nombre ?? usuario.nombre_completo ?? '',
      email: f.email ?? f.correo ?? usuario.email ?? usuario.correo ?? '',
      password:
        f.password ?? f.contrasena ?? f.temp_password ?? usuario.password ?? ''
    }
  })
}

export default function StepEstudiantes({
  paraleloId,
  paralelos,
  onParaleloSeleccionado,
  onAvanzar,
  onRetroceder
}) {
  const [archivo, setArchivo] = useState(null)
  const [importacion, setImportacion] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState(null) // { creados, errores, credenciales }
  const [error, setError] = useState('')

  async function seleccionarParalelo(id) {
    setArchivo(null)
    setImportacion(null)
    setResultado(null)
    setError('')
    try {
      const hemisemestres = await obtenerHemisemestres(id)
      onParaleloSeleccionado({ paraleloId: id, hemisemestres })
    } catch (e) {
      setError(e.message)
    }
  }

  async function seleccionarArchivo(nuevoArchivo) {
    setArchivo(nuevoArchivo)
    setImportacion(null)
    setError('')
    if (!nuevoArchivo) return

    try {
      setImportacion(await importarEstudiantes(nuevoArchivo))
    } catch (e) {
      setError(e.message ?? String(e))
    }
  }

  async function handleProcesar() {
    if (!archivo) {
      setError('Selecciona un archivo Excel o CSV.')
      return
    }
    if (!importacion) {
      setError('El archivo no se pudo importar.')
      return
    }
    if (importacion.errores.length > 0) {
      setError('Corrige las filas reportadas antes de crear las cuentas.')
      return
    }
    setError('')
    setProcesando(true)
    setResultado(null)

    try {
      const estudiantes = importacion.registros

      // Llamar a la Edge Function
      const { data, error: fnErr } = await supabase.functions.invoke(
        'crear-cuentas-estudiantes',
        { body: { personas: estudiantes } }
      )
      if (fnErr) throw fnErr

      // La función puede devolver la lista bajo distintos nombres según su versión.
      const creados = normalizarCuentas(data)
      const errores = data?.errores ?? []

      if (creados.length === 0 && errores.length === 0)
        throw new Error(
          `La función respondió sin cuentas creadas ni errores. Claves recibidas: ${
            data && typeof data === 'object'
              ? Object.keys(data).join(', ')
              : typeof data
          }.`
        )

      // Matricular en el paralelo
      const ids = creados.map(c => c.id).filter(Boolean)
      if (creados.length > 0 && ids.length !== creados.length)
        throw new Error(
          'La Edge Function creó cuentas, pero no devolvió sus IDs de usuario; no se pueden matricular.'
        )
      if (ids.length > 0) await matricularEstudiantes(paraleloId, ids)

      const res = { creados: creados.length, errores, credenciales: creados }
      setResultado(res)

      // Descarga automática del CSV de credenciales
      if (creados.length > 0)
        descargarTexto('credenciales.csv', serializarCSVCredenciales(creados))
    } catch (e) {
      let mensaje = e.message ?? String(e)
      if (e?.context instanceof Response) {
        const respuesta = await e.context
          .clone()
          .json()
          .catch(() => null)
        mensaje = respuesta?.error ?? respuesta?.message ?? mensaje
      }
      setError(mensaje)
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Panel>
      <h3 className="mb-1">Paso 2 — Subir estudiantes</h3>
      <div className="mb-5">
        <SelectorParalelo
          paralelos={paralelos}
          value={paraleloId}
          onChange={seleccionarParalelo}
        />
      </div>
      <p className="text-sm text-ink-soft mb-5">
        Sube un Excel o CSV con columnas{' '}
        <code className="bg-surface px-1 rounded text-xs">nombre_completo</code>{' '}
        y <code className="bg-surface px-1 rounded text-xs">correo</code>. Las
        cuentas se crean automáticamente y recibirás un archivo{' '}
        <strong>credenciales.csv</strong> para distribuir.
      </p>

      {error && <Aviso variant="red">{error}</Aviso>}

      {!resultado ? (
        <div className="flex flex-col gap-4">
          {/* Formato esperado */}
          <div className="bg-surface rounded-sm p-3 font-mono text-xs leading-relaxed text-ink-mid">
            nombre_completo,correo
            <br />
            Malla Cordova Wagner,wmalla@utmach.edu.ec
            <br />
            Pérez López Ana,aperez@utmach.edu.ec
          </div>

          <input
            key={paraleloId}
            type="file"
            accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={e => seleccionarArchivo(e.target.files[0] ?? null)}
            className="text-sm text-ink-soft file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-black/20 file:text-xs file:font-semibold file:bg-white hover:file:bg-surface"
          />

          {archivo && importacion && (
            <div className="flex flex-col gap-2 text-xs text-ink-soft">
              <p>
                <strong className="text-ink">{archivo.name}</strong> ·{' '}
                {importacion.registros.length} estudiante
                {importacion.registros.length !== 1 ? 's' : ''} listo
                {importacion.registros.length !== 1 ? 's' : ''}
              </p>
              {importacion.errores.length > 0 && (
                <Aviso variant="amber">
                  {importacion.errores.length} fila
                  {importacion.errores.length !== 1 ? 's' : ''} con problemas:
                  <ul className="mt-1.5 list-disc list-inside">
                    {importacion.errores.map((detalle, indice) => (
                      <li key={indice}>
                        Fila {detalle.fila}:{' '}
                        {detalle.email ? `${detalle.email} — ` : ''}
                        {detalle.mensaje}
                      </li>
                    ))}
                  </ul>
                </Aviso>
              )}
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  type="button"
                  className="text-xs text-sice-green font-semibold hover:underline"
                  onClick={() =>
                    descargarTexto(
                      'estudiantes-normalizados.csv',
                      importacion.csv
                    )
                  }
                >
                  Descargar CSV normalizado
                </button>
                {/* {importacion.registros.length > 0 && (
                  <span>
                    Primeros registros:{' '}
                    {importacion.registros
                      .slice(0, 3)
                      .map(r => r.nombre_completo)
                      .join(', ')}
                    {importacion.registros.length > 3 ? '…' : ''}
                  </span>
                )} */}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={onRetroceder}>
              <>
                <ArrowBackIcon className="w-4 h-4" /> Volver
              </>
            </Button>
            <Button onClick={handleProcesar} disabled={procesando || !archivo}>
              {procesando ? (
                <>
                  <Spinner className="w-4 h-4" /> Procesando…
                </>
              ) : (
                'Crear cuentas y matricular'
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Aviso variant="green">
            <CheckCircleIcon className="w-4 h-4 inline align-text-bottom mr-1" />{' '}
            {resultado.creados} cuenta{resultado.creados !== 1 ? 's' : ''}{' '}
            matriculada
            {resultado.creados !== 1 ? 's' : ''}. Se descargó{' '}
            <strong>credenciales.csv</strong> automáticamente.
          </Aviso>

          {resultado.errores.length > 0 && (
            <Aviso variant="amber">
              {resultado.errores.length} cuenta
              {resultado.errores.length !== 1 ? 's' : ''} no se pudo
              {resultado.errores.length !== 1 ? 'ieron' : ''} crear:
              <ul className="mt-1.5 list-disc list-inside text-xs">
                {resultado.errores.map((e, i) => (
                  <li key={i}>
                    {e.email}: {e.mensaje}
                  </li>
                ))}
              </ul>
            </Aviso>
          )}

          <button
            className="text-xs flex items-center text-sice-green font-semibold hover:underline self-start"
            onClick={() =>
              descargarTexto(
                'credenciales.csv',
                serializarCSVCredenciales(resultado.credenciales)
              )
            }
          >
            <DownloadIcon className="w-4 h-4 inline align-text-bottom" /> Volver
            a descargar las credenciales
          </button>

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={onRetroceder}>
              <ArrowBackIcon className="w-4 h-4" /> Volver
            </Button>
            <Button onClick={() => onAvanzar({})}>
              <ArrowForwardIcon className="w-4 h-4" /> Continuar a grupos
            </Button>
          </div>
        </div>
      )}
    </Panel>
  )
}
