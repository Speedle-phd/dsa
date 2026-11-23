import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { keysForNotice } from './realtimeTopics'
import { connectRealtime, disconnectRealtime, resubscribeParties, type RealtimeNotice } from './socket'

// Connects while someone is signed in and turns server notices into query refetches. Rendered once in App.
export function RealtimeBridge() {
   const { user } = useAuth()
   const queryClient = useQueryClient()

   useEffect(() => {
      if (!user) {
         disconnectRealtime()
         return
      }
      // A different user may have signed in: start a fresh connection with the current token
      disconnectRealtime()
      const socket = connectRealtime()
      function onNotice(notice: RealtimeNotice) {
         for (const queryKey of keysForNotice(notice)) void queryClient.invalidateQueries({ queryKey })
      }
      // A (re)connect may have missed notices: rejoin party rooms and refetch what is on screen
      function onConnect() {
         resubscribeParties()
         void queryClient.invalidateQueries({ queryKey: ['parties'] })
         void queryClient.invalidateQueries({ queryKey: ['party-sheet'] })
         void queryClient.invalidateQueries({ queryKey: ['encounter'] })
      }
      socket.on('notice', onNotice)
      socket.on('connect', onConnect)
      return () => {
         socket.off('notice', onNotice)
         socket.off('connect', onConnect)
      }
   }, [user, queryClient])

   return null
}
