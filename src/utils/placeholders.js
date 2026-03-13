/**
 * Placeholder por defecto (SVG inline como data URL)
 */
export function getDefaultPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect fill="#f5f5f5" width="200" height="200"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          fill="#999" font-family="system-ui" font-size="14">Sin imagen</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

/**
 * Placeholder para error de carga
 */
export function getErrorPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect fill="#ffebee" width="200" height="200"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
          fill="#d32f2f" font-family="system-ui" font-size="12">Error al cargar</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}