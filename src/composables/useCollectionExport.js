// src/composables/useCollectionExport.js

/**
 * Composable para exportar colecciones a formato Markdown
 * Genera un archivo .md descargable con metadatos y enlaces a las obras
 */
export function useCollectionExport() {
  
  /**
   * Genera el contenido Markdown de una colección
   * @param {Object} collection - Objeto de colección de Supabase
   * @param {Array} items - Array de items con obras normalizadas
   * @returns {string} Contenido en formato Markdown
   */
  function generateMarkdown(collection, items) {
    if (!collection) return ''
    
    // Encabezado de la colección
    let md = `# ${collection.title}\n\n`
    
    // Descripción -si existe-
    if (collection.description) {
      md += `> ${collection.description}\n\n`
    }
    
    // Metadatos
    md += `**Creada por:** ${collection.user_profiles?.display_name || collection.user_profiles?.username || 'Usuario'}\n`
    md += `**Fecha:** ${new Date(collection.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}\n`
    md += `**Obras:** ${items.length}\n`
    if (collection.is_public !== undefined) {
      md += `**Visibilidad:** ${collection.is_public ? 'Pública' : 'Privada'}\n`
    }
    md += `\n---\n\n`
    
    // Lista de obras
    md += `## Obras en esta colección\n\n`
    
    if (items.length === 0) {
      md += `*Esta colección aún no contiene obras.*\n`
    } else {
      items.forEach((item, index) => {
        const artwork = item.museum_artworks || item.artwork
        
        if (!artwork) return
        
        // Número de obra
        md += `### ${index + 1}. ${artwork.title}\n\n`
        
        // Artista y fecha
        if (artwork.artist_name) {
          md += `**Artista:** ${artwork.artist_name}\n`
        }
        if (artwork.creation_date || artwork.period) {
          md += `**Fecha/Período:** ${artwork.creation_date || artwork.period}\n`
        }
        if (artwork.medium) {
          md += `**Técnica:** ${artwork.medium}\n`
        }
        md += `\n`
        
        // Nota del usuario -si existe-
        if (item.user_note) {
          md += `> 💬 *${item.user_note}*\n\n`
        }
        
        // Enlaces
        const internalLink = `/artwork/${artwork.id}`
        const externalLink = artwork.external_url || artwork.objectURL
        
        md += `**Enlaces:**\n`
        md += `- [Ver en Kura](${internalLink})\n`
        if (externalLink) {
          md += `- [Ver en museo fuente](${externalLink})\n`
        }
        md += `\n`
        
        // Separador entre obras -excepto la última-
        if (index < items.length - 1) {
          md += `---\n\n`
        }
      })
    }
    
    // Pie de página
    md += `\n---\n\n`
    md += `*Exportado desde [Kura](https://kura-app.dev) — Plataforma de descubrimiento cultural*\n`
    md += `*Datos proporcionados por The Met API*\n`
    
    return md
  }
  
  /**
   * Descarga un string como archivo .md
   * @param {string} content - Contenido del archivo
   * @param {string} filename - Nombre del archivo (sin extensión)
   */
  function downloadMarkdown(content, filename) {
    if (!content || !filename) return
    
    // Crear blob con encoding UTF-8 para soporte de caracteres especiales
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    
    // Crear URL temporal
    const url = URL.createObjectURL(blob)
    
    // Crear enlace de descarga
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.md`
    
    // Disparar descarga
    document.body.appendChild(link)
    link.click()
    
    // Limpieza
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  /**
   * Función principal: exporta una colección completa a Markdown
   * @param {Object} collection - Colección de Supabase
   * @param {Array} items - Items con obras asociadas
   * @param {string} customFilename - Nombre personalizado opcional
   * @returns {boolean} true si éxito, false si falla
   */
  function exportCollection(collection, items, customFilename = null) {
    try {
      if (!collection?.title) {
        console.error('[CollectionExport] Colección inválida')
        return false
      }
      
      // Generar nombre de archivo seguro
      const baseName = customFilename || 
        collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      
      // Generar contenido Markdown
      const markdown = generateMarkdown(collection, items)
      
      // Descargar archivo
      downloadMarkdown(markdown, baseName)
      
      console.log(`[CollectionExport] Archivo "${baseName}.md" generado correctamente`)
      return true
      
    } catch (err) {
      console.error('[CollectionExport] Error al exportar:', err)
      return false
    }
  }
  
  return {
    generateMarkdown,
    downloadMarkdown,
    exportCollection
  }
}