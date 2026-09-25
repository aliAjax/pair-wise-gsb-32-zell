import Dexie, { type Table } from 'dexie';
import { STORAGE_VERSION } from '../constants/storageVersion';
import { messages } from '../constants/messages';

class TripWeaverDb extends Dexie {
  trips!: Table<unknown, string>;
  spots!: Table<unknown, string>;
  dayPlans!: Table<unknown, string>;
  expenses!: Table<unknown, string>;
  pendingExpenses!: Table<unknown, string>;
  settlementPayments!: Table<unknown, string>;
  constructor() {
    super('tripweaver');
    this.version(1).stores({ trips: 'id,status,destination', spots: 'id,category', dayPlans: 'id,trip_id,day_index' });
    this.version(2).stores({
      trips: 'id,status,destination',
      spots: 'id,category',
      dayPlans: 'id,trip_id,day_index',
      expenses: 'id,trip_id,spent_date,payer',
      pendingExpenses: 'id,trip_id',
      settlementPayments: 'id,trip_id,from,to',
    });
  }
}

export const db = new TripWeaverDb();

export function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed.version === STORAGE_VERSION ? parsed.data as T : fallback;
  } catch {
    console.warn(messages.storageRecovered);
    return fallback;
  }
}

export function saveLocal<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data, updatedAt: new Date().toISOString() }));
}

