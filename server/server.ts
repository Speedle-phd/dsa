import express from 'express'
import { connectToDatabase } from './src/db/connect'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/api/hello', (req, res) => {
   res.json({
      message: 'Hello World!',
   })
})

async function startServer() {
   try {
      await connectToDatabase()

      app.listen(PORT, () => {
         console.log(`Server running on http://localhost:${PORT}`)
      })
   } catch (error) {
      console.error('Failed to connect to MongoDB:', error)
      process.exit(1)
   }
}

startServer()
