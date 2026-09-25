import { defineStore } from 'pinia';
import type { Expense, Ledger, LedgerBundle, PendingExpense } from '../models/ledger';
import type { ExpenseDraft } from '../utils/expenseValidator';
import { validateExpenseDraft } from '../utils/expenseValidator';
import { ledgerApi } from '../api/ledgerApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';

function emptyLedger(tripId: string): Ledger {
  return { trip_id: tripId, expenses: [], pending: [] };
}

export const useLedgerStore = defineStore('ledger', {
  state: () => ({ bundle: ledgerApi.load() as LedgerBundle }),
  getters: {
    ledger: (state) => (tripId: string): Ledger => state.bundle[tripId] || emptyLedger(tripId),
    expenses: (state) => (tripId: string): Expense[] => state.bundle[tripId]?.expenses || [],
    pending: (state) => (tripId: string): PendingExpense[] => state.bundle[tripId]?.pending || [],
  },
  actions: {
    persist() {
      ledgerApi.save(this.bundle);
    },
    ensure(tripId: string): Ledger {
      if (!this.bundle[tripId]) {
        this.bundle[tripId] = emptyLedger(tripId);
        this.persist();
      }
      return this.bundle[tripId];
    },
    /**
     * 提交一笔花销：校验通过立即入账并扣减预算；
     * 不合规则原样进入待核对区并记录原因，不影响预算。
     * pendingId 存在时表示由某条待核对条目修正后重提，通过则移除旧条目，不通过则原地更新原因。
     */
    submitExpense(tripId: string, draft: ExpenseDraft, members: string[], pendingId?: string) {
      const reasons = validateExpenseDraft(draft, members);
      const ledger = this.ensure(tripId);
      const target = pendingId ? ledger.pending.find((entry) => entry.id === pendingId) : undefined;
      if (reasons.length) {
        if (target) {
          target.title = draft.title.trim();
          target.category = (draft.category as PendingExpense['category']) || '';
          target.amountRaw = draft.amountRaw.trim();
          target.payer = draft.payer.trim();
          target.participants = draft.participants;
          target.date = draft.date;
          target.reasons = reasons;
        } else {
          ledger.pending.unshift({
            id: crypto.randomUUID(),
            trip_id: tripId,
            title: draft.title.trim(),
            category: (draft.category as PendingExpense['category']) || '',
            amountRaw: draft.amountRaw.trim(),
            payer: draft.payer.trim(),
            participants: draft.participants,
            date: draft.date,
            reasons,
            created_at: new Date().toISOString(),
          });
        }
        this.persist();
        toast.warn(reasons[0]);
        return false;
      }
      if (target) ledger.pending = ledger.pending.filter((entry) => entry.id !== pendingId);
      ledger.expenses.unshift({
        id: crypto.randomUUID(),
        trip_id: tripId,
        title: draft.title.trim(),
        category: draft.category as Expense['category'],
        amount: Math.round(Number(draft.amountRaw) * 100) / 100,
        payer: draft.payer.trim(),
        participants: Array.from(new Set(draft.participants)),
        date: draft.date,
        created_at: new Date().toISOString(),
      });
      this.persist();
      toast.ok(messages.expenseBooked);
      return true;
    },
    /** 待核对条目修正后重新提交 */
    retryPending(tripId: string, pendingId: string, members: string[]) {
      const ledger = this.ensure(tripId);
      const item = ledger.pending.find((entry) => entry.id === pendingId);
      if (!item) return false;
      const draft: ExpenseDraft = {
        title: item.title,
        category: item.category,
        amountRaw: item.amountRaw,
        payer: item.payer,
        participants: item.participants,
        date: item.date,
      };
      return this.submitExpense(tripId, draft, members, pendingId);
    },
    removeExpense(tripId: string, expenseId: string) {
      const ledger = this.ensure(tripId);
      ledger.expenses = ledger.expenses.filter((entry) => entry.id !== expenseId);
      this.persist();
      toast.ok(messages.expenseDeleted);
    },
    removePending(tripId: string, pendingId: string) {
      const ledger = this.ensure(tripId);
      ledger.pending = ledger.pending.filter((entry) => entry.id !== pendingId);
      this.persist();
      toast.ok(messages.pendingRemoved);
    },
    /** 删除旅行时清理其账本 */
    removeByTrip(tripId: string) {
      delete this.bundle[tripId];
      this.persist();
    },
  },
});
