import Dexie, { Table } from 'dexie';

export interface OfflineOperation {
  id?: number;
  clientOperationId: string;
  type: string;
  payload: any;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  createdAt: Date;
  syncedAt?: Date;
  error?: string;
}

export interface CachedCourse {
  id: string;
  name: string;
  data: any;
  lastUpdated: Date;
}

export class AulaDocenteDB extends Dexie {
  operations!: Table<OfflineOperation>;
  courses!: Table<CachedCourse>;

  constructor() {
    super('aula-docente-db');
    this.version(1).stores({
      operations: '++id, clientOperationId, status, createdAt',
      courses: 'id, lastUpdated',
    });
  }
}

export const db = new AulaDocenteDB();
