// MongoDB Atlas connection helper for Next.js App Router API routes
import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) throw new Error('Missing MONGODB_URI in environment');

  if (process.env.NODE_ENV === 'development') {
    if (!(global as any)._mongoClientPromise) {
      client = new MongoClient(uri);
      (global as any)._mongoClientPromise = client.connect();
    }

    return (global as any)._mongoClientPromise as Promise<MongoClient>;
  }

  if (clientPromise) return clientPromise;

  client = new MongoClient(uri);
  clientPromise = client.connect();
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const dbName = process.env.MONGODB_DB;

  if (!dbName) throw new Error('Missing MONGODB_DB in environment');

  const client = await getClientPromise();
  return client.db(dbName);
}
