import { validateExpenseDraft, isValidAmount } from '../src/utils/expenseValidator';
import { settle, splitExpense } from '../src/utils/settlement';
import type { Expense } from '../src/models/ledger';
import { ExpenseCategory } from '../src/constants/ledger';

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log('PASS', name);
  else { failures += 1; console.log('FAIL', name, detail); }
}

// 金额校验
check('12.34 合法', isValidAmount('12.34'));
check('12.345 非法', !isValidAmount('12.345'));
check('0 非法', !isValidAmount('0'));
check('-5 非法', !isValidAmount('-5'));
check('空 非法', !isValidAmount(''));
check('abc 非法', !isValidAmount('abc'));
check('100 合法', isValidAmount('100'));

// 草稿校验：成员限制
const members = ['我', '朋友', '阿强'];
const badPayer = validateExpenseDraft({ title: '晚饭', category: ExpenseCategory.FOOD, amountRaw: '90', payer: '路人', participants: ['我'], date: '2026-09-25' }, members);
check('非成员付款人被拒', badPayer.some((r) => r.includes('付款人')), JSON.stringify(badPayer));
const badParticipant = validateExpenseDraft({ title: '晚饭', category: ExpenseCategory.FOOD, amountRaw: '90', payer: '我', participants: ['路人'], date: '2026-09-25' }, members);
check('非成员参与人被拒', badParticipant.some((r) => r.includes('参与人')), JSON.stringify(badParticipant));
const noParticipants = validateExpenseDraft({ title: '晚饭', category: ExpenseCategory.FOOD, amountRaw: '90', payer: '我', participants: [], date: '2026-09-25' }, members);
check('无参与人被拒', noParticipants.some((r) => r.includes('至少')), JSON.stringify(noParticipants));
const ok = validateExpenseDraft({ title: '晚饭', category: ExpenseCategory.FOOD, amountRaw: '90', payer: '我', participants: ['我', '朋友'], date: '2026-09-25' }, members);
check('合规草稿通过', ok.length === 0, JSON.stringify(ok));

// 均摊：100 / 3 = 33.33, 33.33, 33.34，总额守恒
const expense: Expense = { id: 'e1', trip_id: 't1', title: '住宿', category: ExpenseCategory.LODGING, amount: 100, payer: '我', participants: ['我', '朋友', '阿强'], date: '2026-09-25', created_at: '' };
const shares = splitExpense(expense);
const shareSum = Object.values(shares).reduce((s, v) => s + Math.round(v * 100), 0);
check('三人摊 100 守恒', shareSum === 10000, String(shareSum));
check('最后一人承担余数', shares['阿强'] === 33.34, JSON.stringify(shares));

// 结算：我垫付 100 三人均摊 -> 我应收 66.66，朋友/阿强各应付 33.33
const result = settle([expense], members);
const me = result.balances.find((b) => b.member === '我')!;
check('垫付人应收 66.67', me.net === 66.67, String(me.net));
check('应付人 33.33', result.balances.find((b) => b.member === '朋友')!.net === -33.33);
check('两笔转账', result.transfers.length === 2, JSON.stringify(result.transfers));
check('转账方向正确', result.transfers.every((t) => t.to === '我'));
const transferSum = Math.round(result.transfers.reduce((s, t) => s + t.amount * 100, 0));
check('转账总额守恒', transferSum === 6667, String(transferSum));

// 多边：A 付 30 给 AB，B 付 60 给 ABC -> 净额头寸可轧差减少笔数
const exps: Expense[] = [
  { id: 'a', trip_id: 't', title: 'x', category: ExpenseCategory.FOOD, amount: 30, payer: 'A', participants: ['A', 'B'], date: '2026-09-25', created_at: '' },
  { id: 'b', trip_id: 't', title: 'y', category: ExpenseCategory.FOOD, amount: 60, payer: 'B', participants: ['A', 'B', 'C'], date: '2026-09-25', created_at: '' },
];
const r2 = settle(exps, ['A', 'B', 'C']);
const nets = Object.fromEntries(r2.balances.map((b) => [b.member, b.net]));
// A: paid 30, share 15+20=35 => -5 ; B: paid 60, share 15+20=35 => +25 ; C: 0-20 => -20
check('轧差净额 A -5', nets.A === -5, JSON.stringify(nets));
check('轧差净额 B +25', nets.B === 25);
check('轧差净额 C -20', nets.C === -20);
check('最少两笔转账', r2.transfers.length === 2, JSON.stringify(r2.transfers));

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TESTS FAILED`);
if (failures) process.exit(1);
