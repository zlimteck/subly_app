import axios from 'axios'

// Configure axios baseURL from environment variable or use relative paths
const baseURL = import.meta.env.VITE_API_URL || ''

axios.defaults.baseURL = baseURL

// Add request interceptor for debugging
axios.interceptors.request.use(
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

export default axios