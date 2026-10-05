import * as XLSX from 'xlsx'

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function claveEncabezado(valor) {
  return normalizarTexto(valor).replace(/[^a-z0-9]/g, '')
}

function esFilaVacia(fila) {
  return fila.every(celda => normalizarTexto(celda) === '')
}

function esFilaGeneradoPor(fila) {
  return fila.some(celda => claveEncabezado(celda).includes('generadopor'))
}

function encontrarColumnas(encabezado, lanzarError = true) {
  const claves = encabezado.map(claveEncabezado)
  const idxNombre = claves.findIndex(clave => clave.includes('nombre'))
  const idxEmail = claves.findIndex(
    clave => clave.includes('correo') || clave.includes('email')
  )

  if (idxNombre === -1 || idxEmail === -1) {
    if (!lanzarError) return null
    throw new Error(
      'El archivo debe tener columnas de nombre completo y correo (o email).'
    )
  }

  return { idxNombre, idxEmail }
}

function encontrarEncabezado(filas) {
  for (let indice = 0; indice < filas.length; indice += 1) {
    const fila = filas[indice]
    if (esFilaGeneradoPor(fila)) break

    const columnas = encontrarColumnas(fila, false)
    if (columnas) return { indice, columnas }
  }

  throw new Error(
    'El archivo debe tener columnas de nombre completo y correo (o email).'
  )
}

function csvSeguro(valor) {
  const texto = String(valor ?? '')
  const protegido = /^[=+\-@]/.test(texto) ? `'${texto}` : texto
  return /[",\n\r]/.test(protegido)
    ? `"${protegido.replace(/"/g, '""')}"`
    : protegido
}

export function serializarCSV(filas) {
  return [
    'nombre_completo,correo',
    ...filas.map(fila =>
      [fila.nombre_completo, fila.email].map(csvSeguro).join(',')
    )
  ].join('\r\n')
}

export function serializarCSVCredenciales(filas) {
  return [
    'nombre_completo,correo,contrasena',
    ...filas.map(fila =>
      [fila.nombre_completo, fila.email, fila.password ?? fila.contrasena ?? '']
        .map(csvSeguro)
        .join(',')
    )
  ].join('\r\n')
}

export function descargarCredencialesExcel(filas) {
  const filasHoja = [
    ['Credenciales de estudiantes', '', ''],
    [
      'Entrega las credenciales de forma segura y solicita el cambio de contraseña.',
      '',
      ''
    ],
    ['Nombre completo', 'Correo institucional', 'Contraseña temporal'],
    ...filas.map(fila => [
      String(fila.nombre_completo ?? ''),
      String(fila.email ?? ''),
      String(fila.password ?? fila.contrasena ?? '')
    ])
  ]
  const hoja = XLSX.utils.aoa_to_sheet(filasHoja)
  const ultimaFila = filasHoja.length

  hoja['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: 2, r: 0 } },
    { s: { c: 0, r: 1 }, e: { c: 2, r: 1 } }
  ]
  hoja['!cols'] = [{ wch: 32 }, { wch: 38 }, { wch: 24 }]
  hoja['!autofilter'] = { ref: `A3:C${ultimaFila}` }

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Credenciales')
  const datos = XLSX.write(libro, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true
  })
  const blob = new Blob([datos], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'credenciales_estudiantes.xlsx'
  enlace.click()
  URL.revokeObjectURL(url)
}

export function descargarTexto(
  nombre,
  contenido,
  tipo = 'text/csv;charset=utf-8;'
) {
  const blob = new Blob([`\uFEFF${contenido}`], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

export async function importarEstudiantes(archivo) {
  const buffer = await archivo.arrayBuffer()
  const libro = XLSX.read(buffer, { type: 'array', raw: false })
  const primeraHoja = libro.Sheets[libro.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json(primeraHoja, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: true
  })

  if (filas.length === 0) throw new Error('El archivo no contiene datos.')

  const { indice: indiceEncabezado, columnas } = encontrarEncabezado(filas)
  const { idxNombre, idxEmail } = columnas
  const registros = []
  const errores = []
  const correos = new Set()

  for (let indice = indiceEncabezado + 1; indice < filas.length; indice += 1) {
    const fila = filas[indice]
    if (esFilaGeneradoPor(fila) || esFilaVacia(fila)) break

    const nombre = String(fila[idxNombre] ?? '').trim()
    const email = String(fila[idxEmail] ?? '')
      .trim()
      .toLowerCase()
    const numeroFila = indice + 1

    if (!nombre || !email) {
      errores.push({
        fila: numeroFila,
        mensaje: 'Falta el nombre o el correo.'
      })
      continue
    }
    if (!email.includes('@')) {
      errores.push({
        fila: numeroFila,
        email,
        mensaje: 'El correo no es válido.'
      })
      continue
    }
    if (correos.has(email)) {
      errores.push({
        fila: numeroFila,
        email,
        mensaje: 'El correo está repetido.'
      })
      continue
    }

    const nombreCapitalizado = nombre => {
      return nombre
        .toLowerCase()
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ')
    }

    correos.add(email)
    registros.push({ nombre_completo: nombreCapitalizado(nombre), email })
  }

  if (registros.length === 0 && errores.length === 0)
    throw new Error(
      'No se encontraron estudiantes antes del final del reporte.'
    )

  return { registros, errores, csv: serializarCSV(registros) }
}
