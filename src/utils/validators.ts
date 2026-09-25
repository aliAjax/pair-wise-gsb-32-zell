import { messages } from '../constants/messages';
import { EXPENSE_CATEGORY_OPTIONS, MAX_EXPENSE_AMOUNT } from '../constants/ledger';
import type { LedgerDraft } from '../models/ledger';

export function required(value: string, field: string) {
  if (!value.trim()) throw new Error(field + '不能为空');
  return value.trim();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** 最多两位小数（允许 12、12.3、12.34，禁止 12.345） */
const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/** 规范化金额字符串：去空格，失败返回 null */
export function parseAmount(raw: string): number | null {
  const text = raw.trim();
  if (!text || isNaN(Number(text))) return null;
  if (!AMOUNT_RE.test(text)) return null;
  const value = Number(text);
  if (!isFinite(value) || value <= 0 || value > MAX_EXPENSE_AMOUNT) return null;
  return value;
}

export interface ExpenseValidationResult {
  valid: boolean;
  reasons: string[];
}

/**
 * 校验一笔待入账花销。
 * 规则：付款人/参与人必须是旅行成员；金额为正且最多两位小数；类别合法；日期合法。
 */
export function validateExpenseDraft(draft: LedgerDraft, members: string[]): ExpenseValidationResult {
  const reasons: string[] = [];

  if (!draft.payer.trim()) {
    reasons.push(messages.expensePayerRequired);
  } else if (!members.includes(draft.payer.trim())) {
    reasons.push(messages.expensePayerNotMember);
  }

  if (!draft.participants.length) {
    reasons.push(messages.expenseParticipantsRequired);
  } else {
    if (new Set(draft.participants).size !== draft.participants.length) {
      reasons.push(messages.expenseParticipantDuplicated);
    }
    if (draft.participants.some((name) => !members.includes(name))) {
      reasons.push(messages.expenseParticipantNotMember);
    }
  }

  if (!(typeof draft.amount === 'number' && isFinite(draft.amount))) {
    reasons.push(messages.expenseAmountRequired);
  } else if (draft.amount <= 0) {
    reasons.push(messages.expenseAmountPositive);
  } else if (draft.amount > MAX_EXPENSE_AMOUNT) {
    reasons.push(messages.expenseAmountTooLarge);
  } else if (!AMOUNT_RE.test(String(draft.amount))) {
    reasons.push(messages.expenseAmountPrecision);
  }

  if (!EXPENSE_CATEGORY_OPTIONS.some((item) => item.value === draft.category)) {
    reasons.push(messages.expenseCategoryInvalid);
  }

  if (!DATE_RE.test(draft.spent_date) || isNaN(new Date(draft.spent_date + 'T00:00:00').getTime())) {
    reasons.push(messages.expenseDateInvalid);
  }

  return { valid: reasons.length === 0, reasons };
}
