import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
})

/**
 * Fetch recent threat logs from the backend.
 * @param {number} limit  max records to return
 */
export async function fetchThreats(limit = 100) {
  const { data } = await api.get('/detect', { params: { limit } })
  return data.data ?? []
}

/**
 * Post a new security log (used by the seed demo button).
 */
export async function postThreat(payload) {
  const { data } = await api.post('/detect', payload)
  return data
}

export default api
