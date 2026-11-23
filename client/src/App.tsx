import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { HeroPage } from './pages/HeroPage'
import { HeroCreation } from './pages/HeroCreation'
import { AdventurianStore } from './pages/AdventurianStore'
import { Services } from './pages/Services'
import { DiceRoller } from './components/DiceRoller'
import { ScrollToTopButton } from './components/ScrollToTopButton'
import { Parties } from './pages/Parties'
import { PartyPage } from './pages/PartyPage'
import { PartySheet } from './pages/PartySheet'
import { FightPage } from './pages/FightPage'
import { PrepareFightPage } from './pages/PrepareFightPage'
import { JoinParty } from './pages/JoinParty'
import { Settings } from './pages/Settings'
import { RealtimeBridge } from './realtime/RealtimeBridge'

function App() {
   return (
      <>
         <Routes>
            <Route path='/login' element={<AuthPage />} />
            <Route
               path='/dashboard'
               element={
                  <ProtectedRoute>
                     <Dashboard />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/create/:draftId'
               element={
                  <ProtectedRoute>
                     <HeroCreation />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/heroes/:heroId'
               element={
                  <ProtectedRoute>
                     <HeroPage />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/store'
               element={
                  <ProtectedRoute>
                     <AdventurianStore />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/services'
               element={
                  <ProtectedRoute>
                     <Services />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/parties'
               element={
                  <ProtectedRoute>
                     <Parties />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/parties/:partyId'
               element={
                  <ProtectedRoute>
                     <PartyPage />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/parties/:partyId/fight'
               element={
                  <ProtectedRoute>
                     <FightPage />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/parties/:partyId/fight/prepare/:encounterId'
               element={
                  <ProtectedRoute>
                     <PrepareFightPage />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/parties/:partyId/heroes/:charId'
               element={
                  <ProtectedRoute>
                     <PartySheet />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/join/:code'
               element={
                  <ProtectedRoute>
                     <JoinParty />
                  </ProtectedRoute>
               }
            />
            <Route
               path='/settings'
               element={
                  <ProtectedRoute>
                     <Settings />
                  </ProtectedRoute>
               }
            />
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
         </Routes>
         <RealtimeBridge />
         <ScrollToTopButton />
         <DiceRoller />
      </>
   )
}

export default App
