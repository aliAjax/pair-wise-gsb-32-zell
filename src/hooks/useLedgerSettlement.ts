import { computed, type ComputedRef } from 'vue';
import type { Trip } from '../models/trip';
import type { Expense } from '../models/ledger';
import type { MemberBalance, TransferAdvice } from '../utils/settlement';
import { settle } from '../utils/settlement';

export interface LedgerSettlementView {
  balances: MemberBalance[];
  transfers: TransferAdvice[];
  total: number;
  members: string[];
}

/**
 * 统一的账本结算视图。
 * 成员集合 = 当前旅行成员 + 已入账花销中出现过的付款人/参与人，
 * 保证成员中途改名或移除后历史账目仍可结清。
 */
export function useLedgerSettlement(tripRef: ComputedRef<Trip | undefined>, expensesRef: ComputedRef<Expense[]>) {
  return computed<LedgerSettlementView>(() => {
    const trip = tripRef.value;
    const expenses = expensesRef.value;
    if (!trip) return { balances: [], transfers: [], total: 0, members: [] };

    const members = new Set(trip.members);
    expenses.forEach((expense) => {
      members.add(expense.payer);
      expense.participants.forEach((name) => members.add(name));
    });

    const result = settle(expenses, Array.from(members));
    return { ...result, members: Array.from(members) };
  });
}
