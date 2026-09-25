import { EXPENSE_CATEGORY_OPTIONS } from '../constants/ledger';
import { messages } from '../constants/messages';

export interface ExpenseDraft {
  title: string;
  category: string;
  amountRaw: string;
  payer: string;
  participants: string[];
  date: string;
}

/** 金额是否为正数且最多两位小数（允许 12、12.3、12.34，拒绝 0、-1、12.345） */
export function isValidAmount(raw: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(raw.trim()) && Number(raw) > 0;
}

export function amountReason(raw: string): string {
  const value = raw.trim();
  if (!value) return messages.errAmountRequired;
  if (!/^\d+(\.\d+)?$/.test(value)) return messages.errAmountPositive;
  if (Number(value) <= 0) return messages.errAmountPositive;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return messages.errAmountPrecision;
  return '';
}

/**
 * 按旅行成员校验一笔花销草稿。
 * 返回 reasons；为空数组表示通过，可入账。
 */
export function validateExpenseDraft(draft: ExpenseDraft, members: string[]): string[] {
  const reasons: string[] = [];
  if (!draft.title.trim()) reasons.push(messages.errTitleRequired);

  const categoryValues = EXPENSE_CATEGORY_OPTIONS.map((item) => item.value) as string[];
  if (!draft.category || !categoryValues.includes(draft.category)) reasons.push(messages.errCategoryRequired);

  const amountIssue = amountReason(draft.amountRaw);
  if (amountIssue) reasons.push(amountIssue);

  if (!draft.payer.trim()) reasons.push(messages.errPayerRequired);
  else if (!members.includes(draft.payer.trim())) reasons.push(messages.errPayerNotMember);

  if (!draft.participants.length) reasons.push(messages.errParticipantsRequired);
  else {
    const outsiders = draft.participants.filter((name) => !members.includes(name));
    if (outsiders.length) reasons.push(messages.errParticipantNotMember);
  }

  if (!draft.date) reasons.push(messages.errDateRequired);

  return Array.from(new Set(reasons));
}
