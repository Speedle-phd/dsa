import axios from 'axios'

export const axiosInstance = axios.create({
   baseURL: import.meta.env.VITE_API_URL,
   timeout: 10_000,
   headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
   },
})

axiosInstance.interceptors.request.use((config) => {
   const token = localStorage.getItem('dsa5.auth.token')

   if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
   }

   return config
})

export default axiosInstance
