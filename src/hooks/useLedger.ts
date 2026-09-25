import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue';
import type { Trip } from '../models/trip';
import type { Expense, MemberBalance, SettlementTransfer } from '../models/ledger';
import { useLedgerStore } from '../stores/ledgerStore';
import { budgetStatus, dailyBudget } from '../utils/budgetCalculator';
import {
  calcMemberBalances,
  calcPaymentNetting,
  suggestTransfers,
  totalPaid,
} from '../utils/ledgerSettlement';
import type { DayPlan } from '../models/dayPlan';
import type { Spot } from '../models/spot';

/**
 * 旅行账本的统一数据视图：详情页与分享页都消费同一个 hook，
 * 保证展示同一套余额与个人结欠。
 */
export function useLedger(
  tripSource: MaybeRefOrGetter<Trip | undefined>,
  dayPlans: MaybeRefOrGetter<DayPlan[]> = [],
  spots: MaybeRefOrGetter<Spot[]> = [],
) {
  const store = useLedgerStore();
  const tripRef = computed(() => toValue(tripSource));

  const expenses = computed(() => {
    const trip = tripRef.value;
    return trip ? store.tripExpenses(trip.id) : [];
  });
  const pending = computed(() => {
    const trip = tripRef.value;
    return trip ? store.tripPending(trip.id) : [];
  });
  const payments = computed(() => {
    const trip = tripRef.value;
    return trip ? store.tripPayments(trip.id) : [];
  });

  /** 初始结欠（不含已登记转账） */
  const balances = computed<MemberBalance[]>(() => {
    const trip = tripRef.value;
    if (!trip) return [];
    return calcMemberBalances(expenses.value, trip.members);
  });

  /** 扣除已登记转账后的剩余结欠 */
  const remainingBalances = computed<MemberBalance[]>(() => {
    const netting = calcPaymentNetting(payments.value);
    return balances.value.map((item) => ({
      ...item,
      // netting: 还款人 +amount、收款人 -amount，与净结欠相加后向 0 回归
      net: Math.round((item.net + (netting.get(item.member) || 0) + Number.EPSILON) * 100) / 100,
    }));
  });

  /** 最少转账建议基于剩余结欠实时计算 */
  const transfers = computed<SettlementTransfer[]>(() => suggestTransfers(remainingBalances.value));

  const settledTotal = computed(() => totalPaid(payments.value));
  const allSettled = computed(() => expenses.value.length > 0 && transfers.value.length === 0);

  const budget = computed(() => {
    const trip = tripRef.value;
    if (!trip) return { planned: 0, ledger: 0, spent: 0, remaining: 0, warning: '' };
    const allDays = toValue(dayPlans);
    const allSpots = toValue(spots);
    return budgetStatus(trip, allDays.filter((day) => day.trip_id === trip.id), allSpots, expenses.value);
  });

  const daily = computed(() => {
    const trip = tripRef.value;
    return trip ? dailyBudget(trip, expenses.value) : { rows: [], outsideSpent: 0 };
  });

  // reactive 包裹后，模板中可直接使用 ledger.budget.spent 等，无需手动 .value
  return reactive({
    store,
    expenses,
    pending,
    payments,
    balances,
    remainingBalances,
    transfers,
    settledTotal,
    allSettled,
    budget,
    daily,
  });
}
