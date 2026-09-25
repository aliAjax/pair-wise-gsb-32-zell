import { ExpenseCategory } from '../constants/ledger';

/** 已入账的垫付花销 */
export interface Expense {
  id: string;
  trip_id: string;
  /** 付款人（必须为旅行成员） */
  payer: string;
  /** 参与人（均摊对象，必须全部为旅行成员，至少 1 人） */
  participants: string[];
  category: ExpenseCategory;
  /** 金额，正数，最多两位小数 */
  amount: number;
  /** 花销发生日期 YYYY-MM-DD，用于当天可用预算扣减 */
  spent_date: string;
  note: string;
  created_at: string;
}

/** 待核对条目：未通过校验，暂不入账、不扣预算 */
export interface PendingExpense {
  id: string;
  trip_id: string;
  payer: string;
  participants: string[];
  category: string;
  amount: number;
  spent_date: string;
  note: string;
  created_at: string;
  /** 留在待核对区的原因列表 */
  reasons: string[];
}

/** 每人应收（正数）/ 应付（负数），正数应收到账，负数应付给他人 */
export interface MemberBalance {
  member: string;
  /** 此人垫付合计 */
  paid: number;
  /** 此人应分摊合计 */
  share: number;
  /** 净结欠 = paid - share，正数应收，负数应付 */
  net: number;
}

/** 最少转账建议的单笔 */
export interface SettlementTransfer {
  from: string;
  to: string;
  amount: number;
}

/** 已确认的转账记录，登记后立即结平对应结欠 */
export interface SettlementPayment {
  id: string;
  trip_id: string;
  from: string;
  to: string;
  amount: number;
  created_at: string;
}

export interface LedgerDraft {
  payer: string;
  participants: string[];
  category: ExpenseCategory;
  amount: number;
  spent_date: string;
  note: string;
}
