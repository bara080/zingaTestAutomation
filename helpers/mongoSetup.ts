/**
 * In-memory Mongo for integration tests.
 * Boots `mongodb-memory-server`, exposes a `getConnection(role)` shim that
 * mirrors Backend's `config/db.js` API so production controllers can be
 * imported and exercised without touching a real cluster.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';

let server: MongoMemoryServer | null = null;
const connections = new Map<string, Connection>();

export async function startMongo(): Promise<void> {
  if (server) return;
  server = await MongoMemoryServer.create();
}

export async function stopMongo(): Promise<void> {
  for (const conn of connections.values()) {
    await conn.close();
  }
  connections.clear();
  if (server) {
    await server.stop();
    server = null;
  }
}

export async function getConnection(role: 'customer' | 'service-provider'): Promise<Connection> {
  if (!server) throw new Error('Call startMongo() first');
  if (connections.has(role)) return connections.get(role)!;
  // Distinct DB name per role mirrors Backend's multi-cluster shape.
  const uri = server.getUri(`zinga-${role}`);
  const conn = await mongoose.createConnection(uri).asPromise();
  connections.set(role, conn);
  return conn;
}

export async function resetMongo(): Promise<void> {
  for (const conn of connections.values()) {
    if (conn.db) await conn.db.dropDatabase();
  }
}
