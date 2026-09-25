import type { DayPlan } from '../models/dayPlan';
import type { Expense } from '../models/ledger';
import type { Spot } from '../models/spot';
import type { Trip } from '../models/trip';
import { messages } from '../constants/messages';
import { yuanToCents } from './settlement';

export function calcTripCost(dayPlans: DayPlan[], spots: Spot[]) {
  const spotMap = new Map(spots.map((spot) => [spot.id, spot]));
  return dayPlans.reduce((sum, day) => {
    return sum + day.items.reduce((inner, item) => inner + (spotMap.get(item.spot_id)?.price || 0), 0);
  }, 0);
}

/** 已入账的实际花销合计（分整数求和，避免浮点误差） */
export function calcLedgerSpent(expenses: Expense[]) {
  return expenses.reduce((sum, expense) => sum + yuanToCents(expense.amount), 0) / 100;
}

/** 某天已入账花销合计 */
export function calcDayLedgerSpent(expenses: Expense[], date: string) {
  return expenses.filter((expense) => expense.date === date).reduce((sum, expense) => sum + yuanToCents(expense.amount), 0) / 100;
}

/** 按旅行日期范围均摊每日预算；日期之外的花销也计入总额 */
export function tripDayCount(trip: Trip) {
  const start = new Date(trip.start_date).getTime();
  const end = new Date(trip.end_date).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 1;
  return Math.round((end - start) / 86400000) + 1;
}

/**
 * 行程可用预算：总预算扣减已入账花销。
 * itineraryCost 为行程中景点的计划金额，仅作超支参考，不与实付重复扣减。
 */
export function budgetStatus(trip: Trip, dayPlans: DayPlan[], spots: Spot[], expenses: Expense[] = []) {
  const itineraryCost = calcTripCost(dayPlans, spots);
  const spent = calcLedgerSpent(expenses);
  const remaining = trip.budget - spent;
  const warning = spent > trip.budget ? messages.budgetExceeded : '';
  return { spent, remaining, warning, itineraryCost };
}

/** 当天可用预算：日均预算扣减当天已入账花销 */
export function dayBudgetStatus(trip: Trip, expenses: Expense[], date: string) {
  const dailyBudget = trip.budget / tripDayCount(trip);
  const spent = calcDayLedgerSpent(expenses, date);
  return { dailyBudget, spent, remaining: dailyBudget - spent };
}
