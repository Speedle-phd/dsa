import {
   createContext,
   useContext,
   useEffect,
   useState,
   type ReactNode,
} from 'react'
import { axiosInstance } from '../axios/axios'
import { getErrorMessage } from '@/utils/errorHandling'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'

const TOKEN_STORAGE_KEY = 'dsa5.auth.token'
const TOKEN_HERO_KEY = 'dsa5.hero'

type User = {
   _id: string
   username: string
   email: string
}

type AuthResponse = {
   message: string
   token: string
   user: User
}

type AuthContextValue = {
   user: User | null
   isRestoring: boolean
   login: (email: string, password: string) => Promise<string>
   register: (
      username: string,
      email: string,
      password: string,
   ) => Promise<string>
   logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null)
   const [isRestoring, setIsRestoring] = useState(() => {
      return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
   })

   useEffect(() => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)

      if (!token) {
         return
      }

      let isMounted = true

      void axiosInstance
         .get<{ user: User }>('/api/users/me')
         .then((response) => {
            if (isMounted) {
               setUser(response.data.user)
            }
         })
         .catch(() => {
            if (isMounted) {
               localStorage.removeItem(TOKEN_STORAGE_KEY)
            }
         })
         .finally(() => {
            if (isMounted) {
               setIsRestoring(false)
            }
         })

      return () => {
         isMounted = false
      }
   }, [])

   async function authenticate(
      endpoint: string,
      data: Record<string, string>,
   ): Promise<string> {
      try {
         const response = await axiosInstance.post<AuthResponse>(endpoint, data)
         localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
         setUser(response.data.user)
         return response.data.message
      } catch (error) {
         console.error(error)
         throw new Error(getErrorMessage(error), { cause: error })
      }
   }

   function login(email: string, password: string) {
      return authenticate('/api/users/login', { email, password })
   }

   function register(username: string, email: string, password: string) {
      return authenticate('/api/users/register', { username, email, password })
   }

   function logout() {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(TOKEN_HERO_KEY)
      setUser(null)
   }

   return (
      <AuthContext.Provider
         value={{ user, isRestoring, login, register, logout }}
      >
         {children}
      </AuthContext.Provider>
   )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
   const context = useContext(AuthContext)

   if (!context) {
      throw new Error(
         t(
            'useAuth must be used within an AuthProvider',
            useLanguageStore.getState().language,
         ),
      )
   }

   return context
}

export { TOKEN_STORAGE_KEY }
