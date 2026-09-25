import type { DayPlan } from '../models/dayPlan';
import type { Spot } from '../models/spot';
import type { Trip } from '../models/trip';
import type { Expense } from '../models/ledger';
import { messages } from '../constants/messages';

/** 行程内景点门票等计划花销 */
export function calcTripCost(dayPlans: DayPlan[], spots: Spot[]) {
  const spotMap = new Map(spots.map((spot) => [spot.id, spot]));
  return dayPlans.reduce((sum, day) => {
    return sum + day.items.reduce((inner, item) => inner + (spotMap.get(item.spot_id)?.price || 0), 0);
  }, 0);
}

/** 账本已入账垫付花销合计（入账即扣预算） */
export function calcLedgerCost(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/** 某一天的已入账花销（当天可用预算扣减口径） */
export function calcDayLedgerCost(expenses: Expense[], date: string) {
  return expenses
    .filter((expense) => expense.spent_date === date)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function budgetStatus(trip: Trip, dayPlans: DayPlan[], spots: Spot[], expenses: Expense[] = []) {
  const planned = calcTripCost(dayPlans, spots);
  const ledger = calcLedgerCost(expenses);
  const spent = round2(planned + ledger);
  return {
    planned,
    ledger,
    spent,
    remaining: round2(trip.budget - spent),
    warning: spent > trip.budget ? messages.budgetExceeded : '',
  };
}

/**
 * 按旅行日期生成逐日可用预算：总预算按天均摊，再扣当天入账花销。
 * 非旅行日期内的花销统一计入“行程外”，避免吞掉明细。
 */
export function dailyBudget(trip: Trip, expenses: Expense[]) {
  const days = dayList(trip.start_date, trip.end_date);
  const dayCount = Math.max(1, days.length);
  const perDay = trip.budget / dayCount;
  const rows = days.map((date) => {
    const daySpent = round2(calcDayLedgerCost(expenses, date));
    return { date, allocated: round2(perDay), spent: daySpent, remaining: round2(perDay - daySpent) };
  });
  const tripDates = new Set(days);
  const outsideSpent = round2(
    expenses.filter((expense) => !tripDates.has(expense.spent_date)).reduce((sum, expense) => sum + expense.amount, 0),
  );
  return { rows, outsideSpent };
}

export function dayList(start: string, end: string): string[] {
  const result: string[] = [];
  const cursor = new Date(start + 'T00:00:00');
  const finish = new Date(end + 'T00:00:00');
  if (isNaN(cursor.getTime()) || isNaN(finish.getTime()) || finish < cursor) return [start];
  while (cursor <= finish) {
    result.push(formatLocalDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

const formatLocalDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
