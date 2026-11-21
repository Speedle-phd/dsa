import { MongoClient, type Db } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

const mongoUri = process.env.MONGO_URI

let db: Db | null = null

export async function connectToDatabase(): Promise<Db> {
   if (db) {
      return db
   }
   if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.')
   }

   const client = new MongoClient(mongoUri)

   await client.connect()

   db = client.db()

   console.log('✅ MongoDB connected successfully')

   return db
}
