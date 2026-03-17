import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';
import { env } from '../config/env.config';

let clientPromise: Promise<MongoClient> | null = null;

function getMongoUri(): string {
  if (!env.MONGODB_URI) throw new Error('Missing MONGODB_URI');
  return env.MONGODB_URI;
}

async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    clientPromise = new MongoClient(getMongoUri()).connect();
  }
  return clientPromise;
}

export async function getUploadsBucket(): Promise<GridFSBucket> {
  const client = await getMongoClient();
  const parsed = new URL(getMongoUri());
  const dbName = parsed.pathname?.replace('/', '') || 'admin';
  const db = client.db(dbName);
  return new GridFSBucket(db, { bucketName: 'uploads' });
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

