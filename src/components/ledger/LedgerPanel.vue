<template>
  <section class="ledger-panel">
    <div class="ledger-summary band">
      <strong>账本总览</strong>
      <p>
        入账花销 {{ formatCurrency(budget.ledger, currency) }} · 行程计划 {{ formatCurrency(budget.planned, currency) }} ·
        已支出合计 {{ formatCurrency(budget.spent, currency) }}
      </p>
      <p :class="budget.remaining < 0 ? 'over' : 'muted'">
        行程可用预算剩余 {{ formatCurrency(budget.remaining, currency) }}
      </p>
      <p v-if="budget.warning" class="over">{{ budget.warning }}</p>
    </div>

    <DailyBudgetTable :daily="daily" :currency="currency" />

    <LedgerBalances
      :balances="remainingBalances"
      :transfers="transfers"
      :settled-total="settledTotal"
      :has-expenses="expenses.length > 0"
      :currency="currency"
      :readonly="readonly"
      @pay="onPay"
    />

    <ExpenseList :expenses="expenses" :currency="currency" :readonly="readonly" @remove="onRemove" />

    <PendingReview
      v-if="!readonly && pending.length"
      :pending="pending"
      :members="members"
      @resubmit="onResubmit"
      @discard="store.discardPending"
    />
  </section>
</template>
<script setup lang="ts">
import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { Trip } from '../../models/trip';
import type { LedgerDraft, SettlementTransfer } from '../../models/ledger';
import { useLedger } from '../../hooks/useLedger';
import { formatCurrency } from '../../utils/formatters';
import LedgerBalances from './LedgerBalances.vue';
import ExpenseList from './ExpenseList.vue';
import PendingReview from './PendingReview.vue';
import DailyBudgetTable from './DailyBudgetTable.vue';
import type { DayPlan } from '../../models/dayPlan';
import type { Spot } from '../../models/spot';

const props = defineProps<{
  trip: MaybeRefOrGetter<Trip | undefined>;
  dayPlans?: MaybeRefOrGetter<DayPlan[]>;
  spots?: MaybeRefOrGetter<Spot[]>;
  readonly?: boolean;
}>();

const {
  store,
  expenses,
  pending,
  remainingBalances,
  transfers,
  settledTotal,
  budget,
  daily,
} = useLedger(() => toValue(props.trip), props.dayPlans || [], props.spots || []);

const trip = computed(() => toValue(props.trip));
const currency = computed(() => trip.value?.currency || 'CNY');
const members = computed(() => trip.value?.members || []);

function onRemove(id: string) {
  store.removeExpense(id);
}
function onPay(transfer: SettlementTransfer) {
  if (trip.value) store.recordPayment(trip.value.id, transfer, trip.value.members);
}
function onResubmit(pendingId: string, draft: LedgerDraft) {
  if (trip.value) store.retryPending(pendingId, trip.value.members, draft);
}
</script>
<style scoped>
.ledger-panel { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
.ledger-summary strong { display: block; margin-bottom: 6px; }
.over { color: #c23b3b; font-weight: 600; }
</style>
