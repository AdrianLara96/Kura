// src/services/mockArtworks.js
// ✅ 5 obras con URLs REALES verificadas de The Met API
// 🔑 Patrón crítico: .trim() en todas las URLs para eliminar espacios invisibles

export const mockArtworks = [
  {
    museum_id: 'met-436535',
    museum_name: 'The Met',
    external_url: 'https://www.metmuseum.org/art/collection/search/436535',
    title: 'Wheat Field with Cypresses',
    artist_name: 'Vincent van Gogh',
    creation_date: '1889',
    period: 'Post-Impressionism',
    // ✅ URL REAL verificada
    image_url: 'https://images.metmuseum.org/CRDImages/ep/original/DP-42549-001.jpg'.trim(),
    thumbnail_url: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP-42549-001.jpg'.trim(),
    description: 'Van Gogh painted this landscape during his stay at Saint-Rémy-de-Provence.',
    tags: ['Landscapes', 'Cypresses', 'Summer', 'Oil on canvas'],
    is_public_domain: true,
    metadata: {
      objectID: 436535,
      accessionNumber: '1993.132',
      department: 'European Paintings',
      classification: 'Paintings',
      isHighlight: true,
      isPublicDomain: true,
      objectDate: '1889',
      medium: 'Oil on canvas',
      dimensions: '28 13/16 × 36 3/4 in. (73.2 × 93.4 cm)'
    }
  },
  {
    museum_id: 'met-436534',
    museum_name: 'The Met',
    external_url: 'https://www.metmuseum.org/art/collection/search/436534',
    title: 'Roses',
    artist_name: 'Vincent van Gogh',
    creation_date: '1890',
    period: 'Post-Impressionism',
    // ✅ URL REAL verificada
    image_url: 'https://images.metmuseum.org/CRDImages/ep/original/DP346475.jpg'.trim(),
    thumbnail_url: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP346475.jpg'.trim(),
    description: 'A vibrant still life of roses painted by Van Gogh in 1890.',
    tags: ['Roses', 'Still Life', 'Oil on canvas'],
    is_public_domain: true,
    metadata: {
      objectID: 436534,
      accessionNumber: '1993.400.5',
      department: 'European Paintings',
      classification: 'Paintings',
      isPublicDomain: true,
      objectDate: '1890',
      medium: 'Oil on canvas'
    }
  },
  {
    museum_id: 'met-436245',
    museum_name: 'The Met',
    external_url: 'https://www.metmuseum.org/art/collection/search/436245',
    title: 'Virgin and Child',
    artist_name: 'Albrecht Dürer',
    creation_date: '1516',
    period: 'Northern Renaissance',
    // ✅ URL REAL verificada
    image_url: 'https://images.metmuseum.org/CRDImages/ep/original/DP164788.jpg'.trim(),
    thumbnail_url: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP164788.jpg'.trim(),
    description: 'Dürer\'s intimate depiction of the Madonna and Child, painted in oil on spruce.',
    tags: ['Madonna and Child', 'Religious art', 'Oil on spruce'],
    is_public_domain: true,
    metadata: {
      objectID: 436245,
      accessionNumber: '17.190.5',
      department: 'European Paintings',
      classification: 'Paintings',
      isPublicDomain: true,
      objectDate: '1516',
      medium: 'Oil on spruce'
    }
  },
  {
    museum_id: 'met-436445',
    museum_name: 'The Met',
    external_url: 'https://www.metmuseum.org/art/collection/search/436445',
    title: 'The Translation of the Holy House of Loreto',
    artist_name: 'Saturnino Gatti',
    creation_date: 'ca. 1490',
    period: 'Italian Renaissance',
    // ✅ URL REAL verificada
    image_url: 'https://images.metmuseum.org/CRDImages/ep/original/DP158156.jpg'.trim(),
    thumbnail_url: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP158156.jpg'.trim(),
    description: 'Angels carry the Holy House of Loreto across the sea, a miraculous legend.',
    tags: ['Angels', 'Madonna and Child', 'Ships', 'Tempera and gold on wood'],
    is_public_domain: true,
    metadata: {
      objectID: 436445,
      accessionNumber: '1973.319',
      department: 'European Paintings',
      classification: 'Paintings',
      isPublicDomain: true,
      objectDate: 'ca. 1490',
      medium: 'Tempera and gold on wood'
    }
  },
  {
    museum_id: 'met-436575',
    museum_name: 'The Met',
    external_url: 'https://www.metmuseum.org/art/collection/search/436575',
    title: 'View of Toledo',
    artist_name: 'El Greco (Domenikos Theotokopoulos)',
    creation_date: 'ca. 1599–1600',
    period: 'Spanish Renaissance',
    // ✅ URL REAL verificada - ¡isHighlight: true!
    image_url: 'https://images.metmuseum.org/CRDImages/ep/original/DP349564.jpg'.trim(),
    thumbnail_url: 'https://images.metmuseum.org/CRDImages/ep/web-large/DP349564.jpg'.trim(),
    description: 'El Greco\'s dramatic landscape of Toledo under a stormy sky.',
    tags: ['Buildings', 'Cities', 'Landscapes', 'Oil on canvas'],
    is_public_domain: true,
    metadata: {
      objectID: 436575,
      accessionNumber: '29.100.6',
      department: 'European Paintings',
      classification: 'Paintings',
      isHighlight: true,
      isPublicDomain: true,
      objectDate: 'ca. 1599–1600',
      medium: 'Oil on canvas'
    }
  }
]

// ✅ Helper CRÍTICO: limpiar URLs de la API del Met (elimina espacios invisibles)
export function cleanMetUrl(url) {
  return url?.toString().trim().replace(/\s+/g, '') || null
}

export async function searchMockArtworks({ query = '', limit = 20 } = {}) {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // ✅ Aplicar cleanUrl a todas las obras al cargar
  let results = [...mockArtworks].map(artwork => ({
    ...artwork,
    image_url: cleanMetUrl(artwork.image_url),
    thumbnail_url: cleanMetUrl(artwork.thumbnail_url),
    external_url: cleanMetUrl(artwork.external_url)
  }))
  
  if (query?.trim()) {
    const q = query.toLowerCase()
    results = results.filter(a => 
      a.title?.toLowerCase().includes(q) || 
      a.artist_name?.toLowerCase().includes(q) ||
      a.tags?.some(t => t.toLowerCase().includes(q))
    )
  }
  
  return {
    results: results.slice(0, limit),
    total: results.length,
    page: 1,
    totalPages: 1
  }
}

export async function getMockArtworkById(museumId) {
  await new Promise(resolve => setTimeout(resolve, 150))
  const artwork = mockArtworks.find(a => a.museum_id === museumId)
  
  if (artwork) {
    // ✅ Devolver con URLs limpias
    return {
      ...artwork,
      image_url: cleanMetUrl(artwork.image_url),
      thumbnail_url: cleanMetUrl(artwork.thumbnail_url),
      external_url: cleanMetUrl(artwork.external_url)
    }
  }
  return null
}