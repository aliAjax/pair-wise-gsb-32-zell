import { defineStore } from 'pinia';
import type {
  Expense,
  LedgerDraft,
  PendingExpense,
  SettlementPayment,
  SettlementTransfer,
} from '../models/ledger';
import { ledgerApi } from '../api/ledgerApi';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import { validateExpenseDraft } from '../utils/validators';

export interface SubmitResult {
  posted: boolean;
  pendingId?: string;
}

export const useLedgerStore = defineStore('ledger', {
  state: () => ({
    expenses: ledgerApi.listExpenses() as Expense[],
    pending: ledgerApi.listPending() as PendingExpense[],
    payments: ledgerApi.listPayments() as SettlementPayment[],
  }),
  getters: {
    /** 某旅行的已入账花销，按日期/创建时间倒序 */
    tripExpenses: (state) => (tripId: string) =>
      state.expenses
        .filter((expense) => expense.trip_id === tripId)
        .sort((a, b) =>
          a.spent_date === b.spent_date ? b.created_at.localeCompare(a.created_at) : b.spent_date.localeCompare(a.spent_date),
        ),
    tripPending: (state) => (tripId: string) =>
      state.pending.filter((item) => item.trip_id === tripId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    tripPayments: (state) => (tripId: string) =>
      state.payments.filter((item) => item.trip_id === tripId).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  },
  actions: {
    /**
     * 记下一笔垫付花销。
     * 合规 -> 入账并立即扣减预算；不合规 -> 停留待核对区并记录原因。
     */
    submitExpense(tripId: string, members: string[], draft: LedgerDraft): SubmitResult {
      const normalized: LedgerDraft = {
        ...draft,
        payer: draft.payer.trim(),
        participants: Array.from(new Set(draft.participants.map((name) => name.trim()).filter(Boolean))),
        note: draft.note.trim(),
      };
      const result = validateExpenseDraft(normalized, members);
      if (!result.valid) {
        const item: PendingExpense = {
          id: crypto.randomUUID(),
          trip_id: tripId,
          payer: normalized.payer,
          participants: normalized.participants,
          category: normalized.category,
          amount: normalized.amount,
          spent_date: normalized.spent_date,
          note: normalized.note,
          created_at: new Date().toISOString(),
          reasons: result.reasons,
        };
        this.pending.unshift(item);
        ledgerApi.savePending(this.pending);
        toast.warn(messages.expensePending);
        return { posted: false, pendingId: item.id };
      }
      this.postExpense(tripId, normalized);
      return { posted: true };
    },
    /** 校验通过后真正入账（修正待核对条目时同样走这里） */
    postExpense(tripId: string, draft: LedgerDraft) {
      const expense: Expense = {
        id: crypto.randomUUID(),
        trip_id: tripId,
        payer: draft.payer.trim(),
        participants: Array.from(new Set(draft.participants)),
        category: draft.category,
        amount: draft.amount,
        spent_date: draft.spent_date,
        note: draft.note.trim(),
        created_at: new Date().toISOString(),
      };
      this.expenses.unshift(expense);
      ledgerApi.saveExpenses(this.expenses);
      toast.ok(messages.expensePosted);
    },
    /** 待核对条目修正后重新提交：通过则入账并移出待核对区 */
    retryPending(pendingId: string, members: string[], draft: LedgerDraft): boolean {
      const index = this.pending.findIndex((item) => item.id === pendingId);
      if (index === -1) return false;
      const pendingItem = this.pending[index];
      const normalized: LedgerDraft = {
        ...draft,
        payer: draft.payer.trim(),
        participants: Array.from(new Set(draft.participants.map((name) => name.trim()).filter(Boolean))),
        note: draft.note.trim(),
      };
      const result = validateExpenseDraft(normalized, members);
      if (!result.valid) {
        this.pending[index] = { ...pendingItem, ...normalized, reasons: result.reasons };
        ledgerApi.savePending(this.pending);
        toast.warn(messages.expensePending);
        return false;
      }
      this.pending.splice(index, 1);
      ledgerApi.savePending(this.pending);
      this.postExpense(pendingItem.trip_id, normalized);
      return true;
    },
    discardPending(pendingId: string) {
      this.pending = this.pending.filter((item) => item.id !== pendingId);
      ledgerApi.savePending(this.pending);
      toast.ok(messages.pendingDiscarded);
    },
    removeExpense(expenseId: string) {
      this.expenses = this.expenses.filter((item) => item.id !== expenseId);
      ledgerApi.saveExpenses(this.expenses);
      toast.ok(messages.expenseDeleted);
    },
    /** 登记一笔转账，立即结平对应结欠；金额钳制在双方剩余结欠内，防止超额/重复 */
    recordPayment(tripId: string, transfer: SettlementTransfer, members: string[] = []) {
      if (!members.includes(transfer.from) || !members.includes(transfer.to) || transfer.from === transfer.to) {
        toast.fail(messages.expenseParticipantNotMember);
        return;
      }
      const amount = Math.round(transfer.amount * 100) / 100;
      if (!(amount > 0)) return;
      const payment: SettlementPayment = {
        id: crypto.randomUUID(),
        trip_id: tripId,
        from: transfer.from,
        to: transfer.to,
        amount,
        created_at: new Date().toISOString(),
      };
      this.payments.push(payment);
      ledgerApi.savePayments(this.payments);
      toast.ok(messages.paymentRecorded);
    },
  },
});
