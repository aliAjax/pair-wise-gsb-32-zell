import type { LedgerBundle } from '../models/ledger';
import { STORAGE_KEYS } from '../constants/storageVersion';
import { loadLocal, saveLocal } from '../utils/storage';

export const ledgerApi = {
  load: () => loadLocal<LedgerBundle>(STORAGE_KEYS.ledger, {}),
  save: (bundle: LedgerBundle) => saveLocal(STORAGE_KEYS.ledger, bundle),
};
