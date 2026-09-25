import type { Expense, MemberBalance, SettlementPayment, SettlementTransfer } from '../models/ledger';

const CENT = 100;
/** 四舍五入到分，规避浮点误差 */
const roundCent = (value: number) => Math.round((value + Number.EPSILON) * CENT) / CENT;

export interface SplitResult {
  /** 参与人 -> 本笔应摊金额，总额恰好等于 expense.amount */
  shares: Map<string, number>;
}

/**
 * 按人头均摊一笔花销。
 * 不能整除时，余数（每单位 1 分）按参与人顺序补给前 r 人，保证合计精确等于金额。
 */
export function splitExpense(expense: Expense): SplitResult {
  const people = expense.participants;
  const totalCents = Math.round(expense.amount * CENT);
  const base = Math.floor(totalCents / people.length);
  let remainder = totalCents - base * people.length;
  const shares = new Map<string, number>();
  people.forEach((member, index) => {
    const cents = base + (index < remainder ? 1 : 0);
    shares.set(member, roundCent(cents / CENT));
  });
  return { shares };
}

/**
 * 汇总每个人的垫付、应摊与净结欠。
 * net > 0 应收（别人欠 ta），net < 0 应付（ta 欠别人）。
 */
export function calcMemberBalances(expenses: Expense[], members: string[]): MemberBalance[] {
  const paid = new Map<string, number>();
  const share = new Map<string, number>();
  members.forEach((member) => {
    paid.set(member, 0);
    share.set(member, 0);
  });

  expenses.forEach((expense) => {
    paid.set(expense.payer, roundCent((paid.get(expense.payer) || 0) + expense.amount));
    const { shares } = splitExpense(expense);
    shares.forEach((amount, member) => {
      share.set(member, roundCent((share.get(member) || 0) + amount));
    });
  });

  return members.map((member) => {
    const memberPaid = paid.get(member) || 0;
    const memberShare = share.get(member) || 0;
    return { member, paid: memberPaid, share: memberShare, net: roundCent(memberPaid - memberShare) };
  });
}

/**
 * 贪心结算：每次让最大债权人与最大债务人直接转账，金额取二者绝对值较小者。
 * 该算法给出笔数很少的转账建议（常见场景即最少）。
 */
export function suggestTransfers(balances: MemberBalance[]): SettlementTransfer[] {
  const creditors = balances
    .filter((item) => item.net > 0)
    .map((item) => ({ name: item.member, amount: roundCent(item.net) }))
    .sort((a, b) => b.amount - a.amount);
  const debtors = balances
    .filter((item) => item.net < 0)
    .map((item) => ({ name: item.member, amount: roundCent(-item.net) }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = roundCent(Math.min(debtors[i].amount, creditors[j].amount));
    if (amount > 0) {
      transfers.push({ from: debtors[i].name, to: creditors[j].name, amount });
    }
    debtors[i].amount = roundCent(debtors[i].amount - amount);
    creditors[j].amount = roundCent(creditors[j].amount - amount);
    if (debtors[i].amount === 0) i += 1;
    if (creditors[j].amount === 0) j += 1;
  }
  return transfers;
}

/**
 * 已登记转账对净结欠的抵消额，与 useLedger 中的 remaining = net + netting 配合：
 * 还款人 from 净结欠为负，记 +amount 后向 0 回归；
 * 收款人 to 净结欠为正，记 -amount 后向 0 回归。
 */
export function calcPaymentNetting(payments: SettlementPayment[]): Map<string, number> {
  const net = new Map<string, number>();
  payments.forEach((payment) => {
    net.set(payment.from, roundCent((net.get(payment.from) || 0) + payment.amount));
    net.set(payment.to, roundCent((net.get(payment.to) || 0) - payment.amount));
  });
  return net;
}

/** 登记过的转账总额 */
export function totalPaid(payments: SettlementPayment[]): number {
  return roundCent(payments.reduce((sum, payment) => sum + payment.amount, 0));
}
