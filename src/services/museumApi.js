import axios from 'axios'

const RIJKS_BASE = 'https://www.rijksmuseum.nl/api/en/collection'
const API_KEY = import.meta.env.VITE_RIJKS_API_KEY

export const museumApi = {
  async searchArtworks(params = {}) {
    const response = await axios.get(`${RIJKS_BASE}`, {
      params: { key: API_KEY, ...params }
    })
    return response.data.artObjects
  },
  
  async getArtworkDetail(id) {
    const response = await axios.get(`${RIJKS_BASE}/${id}`, {
      params: { key: API_KEY }
    })
    return response.data.artObject
  }
}