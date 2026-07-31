import { db, OfflineOperation } from './database';

export async function queueOperation(type: string, payload: any): Promise<string> {
  const clientOperationId = crypto.randomUUID();
  await db.operations.add({
    clientOperationId,
    type,
    payload,
    status: 'PENDING',
    createdAt: new Date(),
  });
  return clientOperationId;
}

export async function getPendingOperations(): Promise<OfflineOperation[]> {
  return db.operations.where('status').equals('PENDING').toArray();
}

export async function markOperationSynced(clientOperationId: string): Promise<void> {
  await db.operations
    .where('clientOperationId')
    .equals(clientOperationId)
    .modify({ status: 'SYNCED', syncedAt: new Date() });
}

export async function markOperationFailed(clientOperationId: string, error: string): Promise<void> {
  await db.operations
    .where('clientOperationId')
    .equals(clientOperationId)
    .modify({ status: 'FAILED', error });
}

export async function clearSyncedOperations(): Promise<void> {
  await db.operations.where('status').equals('SYNCED').delete();
}
