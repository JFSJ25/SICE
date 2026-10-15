import * as XLSX from 'xlsx'

const formatearHemisemestre = nombre => {
  return nombre === 'Primer hemisemestre'
    ? 'Hemi 1'
    : nombre === 'Segundo hemisemestre'
      ? 'Hemi 2'
      : nombre
}

export function descargarReporteNotasExcel({
  filas,
  nombreParalelo,
  nombrePeriodo,
  nombresHemisemestres
}) {
  const titulo = `Reporte de notas finales · ${nombreParalelo}`
  const subtitulo = `${nombrePeriodo} · ${nombresHemisemestres.join(' y ')} · Ponderación: 70% docente / 30% coevaluación`
  const encabezados = [
    'Estudiante',
    'Grupo',
    'Rol',
    ...nombresHemisemestres.flatMap(nombre => {
      const hemi = formatearHemisemestre(nombre)

      return [
        `${hemi} - Docente/100`,
        `${hemi} - Coevaluación/100`,
        `${hemi} - Nota final/10`
      ]
    })
  ]

  const filasHoja = [
    [titulo, ...Array(encabezados.length - 1).fill('')],
    [subtitulo, ...Array(encabezados.length - 1).fill('')],
    encabezados,
    ...filas.map(fila => [
      fila.nombre,
      `Grupo ${fila.grupoNumero}`,
      fila.rol,
      ...nombresHemisemestres.flatMap(nombre => {
        const nota = fila.notas[nombre]
        return [
          formatearNumero(nota?.docente),
          formatearNumero(nota?.coevaluacion),
          formatearNumero(nota?.final)
        ]
      })
    ])
  ]

  const hoja = XLSX.utils.aoa_to_sheet(filasHoja)
  const ultimaColumna = encabezados.length - 1
  const ultimaFila = filasHoja.length
  hoja['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: ultimaColumna, r: 0 } },
    { s: { c: 0, r: 1 }, e: { c: ultimaColumna, r: 1 } }
  ]
  hoja['!cols'] = [
    { wch: 34 },
    { wch: 12 },
    { wch: 14 },
    ...nombresHemisemestres.flatMap(() => [
      { wch: 20 },
      { wch: 24 },
      { wch: 20 }
    ])
  ]
  hoja['!autofilter'] = {
    ref: `A3:${XLSX.utils.encode_col(ultimaColumna)}${ultimaFila}`
  }

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Notas finales')
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
  enlace.download = 'reporte_notas_finales.xlsx'
  enlace.click()
  URL.revokeObjectURL(url)
}

function formatearNumero(valor) {
  return valor === null || valor === undefined
    ? 'Pendiente'
    : Number(valor.toFixed(1))
}
