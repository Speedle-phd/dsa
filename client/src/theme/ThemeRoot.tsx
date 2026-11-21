import { Toaster } from 'sonner'
import { useAppliedTheme } from './themeStore'

// Keeps <html> in sync with the chosen theme; toasts follow it too.
export function ThemeRoot() {
   const theme = useAppliedTheme()
   return <Toaster position='top-right' richColors theme={theme} />
}
