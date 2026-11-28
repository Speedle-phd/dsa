import {
   createContext,
   useContext,
   useEffect,
   useState,
   type ReactNode,
} from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { axiosInstance } from '../axios/axios'
import { getErrorMessage } from '@/utils/errorHandling'
import { useLanguageStore } from '@/locales/languageStore'
import { t } from '@/locales/translation'
import { useHeroStore } from '@/features/heroes/heroStore'

const TOKEN_STORAGE_KEY = 'dsa5.auth.token'
const TOKEN_HERO_KEY = 'dsa5.hero'
// The account the remembered browser state (active hero) belongs to; another account must not inherit it
const ACCOUNT_KEY = 'dsa5.auth.account'

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

// A session for another account starts clean: no active hero and no cached data of the previous account.
// The same account (e.g. after its token expired) keeps its active hero.
function startSession(queryClient: QueryClient, next: User) {
   if (localStorage.getItem(ACCOUNT_KEY) !== next._id) {
      useHeroStore.getState().clearHero()
      queryClient.clear()
   }
   localStorage.setItem(ACCOUNT_KEY, next._id)
}

export function AuthProvider({ children }: { children: ReactNode }) {
   const queryClient = useQueryClient()
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
            if (!isMounted) return
            const remembered = useHeroStore.getState().hero
            if (localStorage.getItem(ACCOUNT_KEY) === null && remembered) {
               // Browsers from before the account marker: keep the active hero only if this account can open it
               localStorage.setItem(ACCOUNT_KEY, response.data.user._id)
               axiosInstance.get(`/api/chars/${remembered._id}`).catch((error: unknown) => {
                  const notFound = (error as { response?: { status?: number } }).response?.status === 404
                  if (notFound && useHeroStore.getState().hero?._id === remembered._id) useHeroStore.getState().clearHero()
               })
            } else {
               startSession(queryClient, response.data.user)
            }
            setUser(response.data.user)
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
   }, [queryClient])

   async function authenticate(
      endpoint: string,
      data: Record<string, string>,
   ): Promise<string> {
      try {
         const response = await axiosInstance.post<AuthResponse>(endpoint, data)
         localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token)
         startSession(queryClient, response.data.user)
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
      // Clear the store too: removing only the storage key left the hero in memory, and the store wrote it back.
      // Cached data of this account must not show for the next one in this tab.
      useHeroStore.getState().clearHero()
      queryClient.clear()
      localStorage.removeItem(TOKEN_HERO_KEY)
      localStorage.removeItem(ACCOUNT_KEY)
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
