import type { Expense, PendingExpense, SettlementPayment } from '../models/ledger';
import { STORAGE_KEYS } from '../constants/storageVersion';
import { loadLocal, saveLocal } from '../utils/storage';

export const ledgerApi = {
  listExpenses: () => loadLocal<Expense[]>(STORAGE_KEYS.expenses, []),
  saveExpenses: (items: Expense[]) => saveLocal(STORAGE_KEYS.expenses, items),
  listPending: () => loadLocal<PendingExpense[]>(STORAGE_KEYS.pendingExpenses, []),
  savePending: (items: PendingExpense[]) => saveLocal(STORAGE_KEYS.pendingExpenses, items),
  listPayments: () => loadLocal<SettlementPayment[]>(STORAGE_KEYS.settlementPayments, []),
  savePayments: (items: SettlementPayment[]) => saveLocal(STORAGE_KEYS.settlementPayments, items),
};
