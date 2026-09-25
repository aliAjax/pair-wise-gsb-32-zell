import type { Expense } from '../models/ledger';

/** 整数分（cents）避免浮点误差 */
export const yuanToCents = (yuan: number) => Math.round(yuan * 100);
export const centsToYuan = (cents: number) => cents / 100;

export interface MemberBalance {
  member: string;
  /** 垫付合计（元） */
  paid: number;
  /** 应承担合计（元） */
  share: number;
  /** 净额：正=应收，负=应付（元） */
  net: number;
}

export interface TransferAdvice {
  from: string;
  to: string;
  amount: number;
}

/**
 * 单笔花销按人头均摊，结果精确到分。
 * 为保证总额守恒：前 n-1 人向下取整到分，最后一人承担余数。
 */
export function splitExpense(expense: Expense): Record<string, number> {
  const totalCents = yuanToCents(expense.amount);
  const headcount = expense.participants.length;
  const base = Math.floor(totalCents / headcount);
  const remainder = totalCents - base * headcount;

  const result: Record<string, number> = {};
  expense.participants.forEach((member, index) => {
    const cents = base + (index === headcount - 1 ? remainder : 0);
    result[member] = centsToYuan(cents);
  });
  return result;
}

/**
 * 汇总一组花销中每个成员的垫付、应承担与净额。
 * unionMembers 为需要展示的全部成员（当前旅行成员 + 历史花销中出现过的人）。
 */
export function calcBalances(expenses: Expense[], unionMembers: string[]): MemberBalance[] {
  const paidCents = new Map<string, number>();
  const shareCents = new Map<string, number>();
  unionMembers.forEach((member) => {
    paidCents.set(member, 0);
    shareCents.set(member, 0);
  });

  expenses.forEach((expense) => {
    paidCents.set(expense.payer, (paidCents.get(expense.payer) || 0) + yuanToCents(expense.amount));
    const shares = splitExpense(expense);
    Object.entries(shares).forEach(([member, amount]) => {
      shareCents.set(member, (shareCents.get(member) || 0) + yuanToCents(amount));
    });
  });

  return unionMembers.map((member) => {
    const paid = centsToYuan(paidCents.get(member) || 0);
    const share = centsToYuan(shareCents.get(member) || 0);
    return { member, paid, share, net: centsToYuan((paidCents.get(member) || 0) - (shareCents.get(member) || 0)) };
  });
}

/**
 * 最少转账建议：贪心匹配最大债权人与最大债务人，
 * 每次结清其中一方，使转账笔数最少。
 */
export function suggestTransfers(balances: MemberBalance[]): TransferAdvice[] {
  const creditors = balances
    .filter((item) => item.net > 0)
    .map((item) => ({ member: item.member, cents: yuanToCents(item.net) }))
    .sort((a, b) => b.cents - a.cents);
  const debtors = balances
    .filter((item) => item.net < 0)
    .map((item) => ({ member: item.member, cents: -yuanToCents(item.net) }))
    .sort((a, b) => b.cents - a.cents);

  const advice: TransferAdvice[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const settle = Math.min(debtors[i].cents, creditors[j].cents);
    if (settle > 0) {
      advice.push({ from: debtors[i].member, to: creditors[j].member, amount: centsToYuan(settle) });
    }
    debtors[i].cents -= settle;
    creditors[j].cents -= settle;
    if (debtors[i].cents === 0) i += 1;
    if (creditors[j].cents === 0) j += 1;
  }
  return advice;
}

/** 一次结清所需的完整结果 */
export interface Settlement {
  balances: MemberBalance[];
  transfers: TransferAdvice[];
  total: number;
}

export function settle(expenses: Expense[], unionMembers: string[]): Settlement {
  const balances = calcBalances(expenses, unionMembers);
  const transfers = suggestTransfers(balances);
  const total = centsToYuan(expenses.reduce((sum, expense) => sum + yuanToCents(expense.amount), 0));
  return { balances, transfers, total };
}
