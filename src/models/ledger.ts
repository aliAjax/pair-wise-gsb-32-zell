import type { ExpenseCategory } from '../constants/ledger';

/** 已入账花销（垫付记录） */
export interface Expense {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory;
  /** 金额，单位：元，最多两位小数 */
  amount: number;
  /** 付款人（必须为旅行成员） */
  payer: string;
  /** 参与人（必须全部为旅行成员），按人头均摊 */
  participants: string[];
  /** 花销日期 YYYY-MM-DD，用于当天可用预算扣减 */
  date: string;
  created_at: string;
}

/** 待核对条目：未通过校验的原始录入 */
export interface PendingExpense {
  id: string;
  trip_id: string;
  title: string;
  category: ExpenseCategory | '';
  amountRaw: string;
  payer: string;
  participants: string[];
  date: string;
  /** 未通过校验的原因列表 */
  reasons: string[];
  created_at: string;
}

/** 单本旅行账本 */
export interface Ledger {
  trip_id: string;
  expenses: Expense[];
  pending: PendingExpense[];
}

/** 所有旅行的账本集合，按 trip_id 索引 */
export type LedgerBundle = Record<string, Ledger>;
