import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { HeroPage } from './pages/HeroPage'
import { HeroCreation } from './pages/HeroCreation'
import { AdventurianStore } from './pages/AdventurianStore'
import { Services } from './pages/Services'
import { DiceRoller } from './components/DiceRoller'

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
            <Route path='*' element={<Navigate to='/dashboard' replace />} />
         </Routes>
         <DiceRoller />
      </>
   )
}

export default App
