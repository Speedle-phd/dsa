import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/errorHandling'
import { spendFatePoint, type Stats } from './statsApi'

// Spends one Schip on the server (S. 29); resolves false when it could not be spent.
export function useFatePoint(stats: Stats) {
   const queryClient = useQueryClient()
   const mutation = useMutation({
      mutationFn: () => spendFatePoint(stats._id),
      onSuccess: (next) => queryClient.setQueryData(['stats', stats.charId], next),
      onError: (error) => toast.error(getErrorMessage(error)),
   })
   return {
      available: stats.fatePoints.current,
      pending: mutation.isPending,
      spend: async () => {
         try {
            await mutation.mutateAsync()
            return true
         } catch {
            return false
         }
      },
   }
}
