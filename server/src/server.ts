import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoutes from '@/routes/userRoutes'
import charRoutes from '@/routes/charRoutes'
import statsRoutes from '@/routes/statsRoutes'
import creationRoutes from '@/routes/creationRoutes'
import partyRoutes from '@/routes/partyRoutes'
import npcTemplateRoutes from '@/routes/npcTemplateRoutes'
import { createSocketServer } from '@/socket'
import { initRealtime } from '@/socket/realtime'
import { socketAccess } from '@/utils/partyAccess'
import { errorHandler, notFound } from '@/middleware/errorHandler'
import { InternalServerError } from '@/utils/appError'
import { migrateEmbeddedCompanions } from '@/utils/companionMigration'
import { migrateTalentsToActive } from '@/utils/talentMigration'

dotenv.config()

const app = express()
// Number of reverse proxies in front (nginx in the production compose stack); 0 = direct.
const trustProxy = Number(process.env.TRUST_PROXY || 0)
if (trustProxy > 0) app.set('trust proxy', trustProxy)
const PORT = Number(process.env.PORT || 3000)
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
   .split(',')
   .map((origin) => origin.trim())
   .filter(Boolean)
// Every click on the sheet is a request; development gets a higher limit so normal play and tests don't hit 429.
const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   // Production: ~1 request/s on average per client, well above heavy play (opening a sheet ≈ 10, a fight round a few).
   limit: process.env.NODE_ENV === 'production' ? 1000 : 2000,
   standardHeaders: 'draft-8',
   legacyHeaders: false,
})

app.use(
   cors({
      origin: allowedOrigins,
      credentials: true,
   }),
)
app.use(helmet())
app.use(express.json({ limit: '100kb' }))
app.use('/api', apiLimiter)

app.get('/api/hello', (_req, res) => {
   res.json({ message: 'Hello World!' })
})

app.use('/api/users', userRoutes)
app.use('/api/chars', charRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/creation', creationRoutes)
app.use('/api/parties', partyRoutes)
app.use('/api/npc-templates', npcTemplateRoutes)

app.use(notFound)
app.use(errorHandler)

async function startServer() {
   try {
      const mongoUri = process.env.MONGO_URI

      if (!mongoUri) {
         throw new InternalServerError(
            'MONGO_URI is not defined in the environment variables.',
         )
      }

      await mongoose.connect(mongoUri)
      console.log('✅ MongoDB connected successfully')
      await migrateEmbeddedCompanions()
      await migrateTalentsToActive()

      // Express and Socket.IO share one HTTP server (party live updates, see socket/index.ts)
      const httpServer = createServer(app)
      initRealtime(createSocketServer(httpServer, allowedOrigins, socketAccess))
      httpServer.listen(PORT, () => {
         console.log(`✅ Server running on http://localhost:${PORT}`)
      })
   } catch (error) {
      console.error('Failed to connect to MongoDB:', error)
      process.exit(1)
   }
}

startServer()
