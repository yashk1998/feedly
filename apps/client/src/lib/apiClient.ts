import axios, { AxiosInstance } from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'

export function useApiClient(): AxiosInstance {
  const { getToken } = useAuth()

  return useMemo(() => {
    const client = axios.create({
      baseURL: '/api',
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    client.interceptors.request.use(async (config) => {
      try {
        const token = await getToken()
        if (token) {
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.warn('Failed to retrieve auth token', error)
      }

      config.headers = config.headers ?? {}
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
      return config
    })

    return client
  }, [getToken])
}
