import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    // Try health endpoint first
    const response = await axios.get('http://localhost:8000/health', { 
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
      }
    })
    return response.status === 200
  } catch (error: any) {
    // If health fails, try root endpoint
    try {
      const response = await axios.get('http://localhost:8000/', { 
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
        }
      })
      return response.status === 200
    } catch (error2: any) {
      console.error('Backend connection test failed:', error2?.message || error?.message)
      return false
    }
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: false,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - Backend server may be slow or unavailable')
      } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        console.error('Network Error - Backend server may not be running on http://localhost:8000')
        console.error('Please ensure:')
        console.error('1. Backend server is running: cd backend && python -m uvicorn app.main:app --reload --port 8000')
        console.error('2. Backend is accessible at http://localhost:8000')
        console.error('3. No firewall is blocking the connection')
      } else {
        console.error('Network Error:', error.message)
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
}

// Signals API
export const signalsApi = {
  getAll: (zoneId?: string) =>
    api.get('/signals', { params: { zone_id: zoneId } }),
  getById: (id: string) => api.get(`/signals/${id}`),
  update: (id: string, data: any) => api.put(`/signals/${id}`, data),
  updateTiming: (id: string, timing: any) =>
    api.put(`/signals/${id}/timing`, timing),
}

// Traffic API
export const trafficApi = {
  getStats: (zoneId?: string) =>
    api.get('/traffic/stats', { params: { zone_id: zoneId } }),
  getHistory: (start: string, end: string, zoneId?: string) =>
    api.get('/traffic/history', {
      params: { start, end, zone_id: zoneId },
    }),
  getZones: () => api.get('/traffic/zones'),
  getPredictions: (hours: number = 6, zoneId?: string) =>
    api.get('/traffic/predictions', { params: { hours, zone_id: zoneId } }),
}

// Emergency API
export const emergencyApi = {
  createRoute: (data: any) => api.post('/emergency/routes', data),
  getActiveRoutes: () => api.get('/emergency/routes/active'),
  deactivateRoute: (id: string) => api.put(`/emergency/routes/${id}/deactivate`),
  getActiveCorridors: () => api.get('/emergency/routes/active'),
  clearSignals: (data: any) => api.post('/emergency/clear-signals', data),
}

// AI Explanation API
export const aiExplanationApi = {
  getLatest: (signalId: string) =>
    api.get(`/ai-explanation/${signalId}/latest`),
  getHistory: (signalId: string, limit = 10) =>
    api.get(`/ai-explanation/${signalId}/history`, { params: { limit } }),
}

// Zones API
export const zonesApi = {
  getAll: () => api.get('/zones'),
  create: (data: any) => api.post('/zones', data),
}

// Operators API
export const operatorsApi = {
  getAll: () => api.get('/operators'),
  create: (data: any) => api.post('/operators', data),
  assignZone: (operatorId: string, zoneId: string) =>
    api.put(`/operators/${operatorId}/assign-zone`, { zone_id: zoneId }),
}

// Real-Time Data API
export const realtimeApi = {
  getTrafficPattern: () => api.get('/realtime/traffic-pattern'),
  getWeather: () => api.get('/realtime/weather'),
  getRoadCongestion: () => api.get('/realtime/road-congestion'),
  getOsmData: () => api.get('/realtime/osm-data'),
}

export default api
