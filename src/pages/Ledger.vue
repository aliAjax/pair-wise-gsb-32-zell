<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button @click="router.push('/trip/' + trip.id)">返回详情</el-button>
      <el-button @click="router.push('/share/' + trip.id)">分享预览</el-button>
    </div>

    <section class="grid">
      <div class="band">
        <strong>行程可用预算</strong>
        <p>总预算 {{ formatCurrency(trip.budget, trip.currency) }}</p>
        <p>已入账 {{ formatCurrency(budget.spent, trip.currency) }} ·
          <span :class="budget.remaining < 0 ? 'over' : ''">剩余 {{ formatCurrency(budget.remaining, trip.currency) }}</span>
        </p>
        <p v-if="budget.warning" class="over">{{ budget.warning }}</p>
      </div>
      <div class="band">
        <strong>当天可用预算（{{ selectedDate }}）</strong>
        <p>日均 {{ formatCurrency(dayBudget.dailyBudget, trip.currency) }}</p>
        <p>当天已入账 {{ formatCurrency(dayBudget.spent, trip.currency) }} ·
          <span :class="dayBudget.remaining < 0 ? 'over' : ''">剩余 {{ formatCurrency(dayBudget.remaining, trip.currency) }}</span>
        </p>
        <el-date-picker v-model="selectedDate" type="date" value-format="YYYY-MM-DD" size="small" />
      </div>
      <div class="band">
        <strong>旅行成员（{{ trip.members.length }}）</strong>
        <p class="muted">只有成员可以当付款人或参与人</p>
        <p>
          <el-tag v-for="name in trip.members" :key="name" closable @close="removeMember(name)" style="margin: 2px">{{ name }}</el-tag>
        </p>
        <div class="toolbar">
          <el-input v-model="newMember" placeholder="新同伴名字" size="small" style="width: 160px" />
          <el-button size="small" type="primary" @click="addMember">加入旅行</el-button>
        </div>
      </div>
    </section>

    <ExpenseForm ref="formRef" :members="trip.members" :default-date="selectedDate" :min-date="trip.start_date" :max-date="trip.end_date" @submit="onSubmit" />

    <PendingReview :pending="ledgerStore.pending(trip.id)" @edit="editPending" @remove="ledgerStore.removePending(trip.id, $event)" />

    <ExpenseList :expenses="ledgerStore.expenses(trip.id)" :currency="trip.currency" editable @remove="ledgerStore.removeExpense(trip.id, $event)" />

    <SettlementPanel :view="settlement" :currency="trip.currency" />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useSpotStore } from '../stores/spotStore';
import { useLedgerStore } from '../stores/ledgerStore';
import { useLedgerSettlement } from '../hooks/useLedgerSettlement';
import { budgetStatus, dayBudgetStatus } from '../utils/budgetCalculator';
import { formatCurrency } from '../utils/formatters';
import type { ExpenseDraft } from '../utils/expenseValidator';
import { messages } from '../constants/messages';
import { toast } from '../utils/message';
import TripHeader from '../components/common/TripHeader.vue';
import ExpenseForm from '../components/common/ExpenseForm.vue';
import ExpenseList from '../components/common/ExpenseList.vue';
import PendingReview from '../components/common/PendingReview.vue';
import SettlementPanel from '../components/common/SettlementPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const dayPlanStore = useDayPlanStore();
const spotStore = useSpotStore();
const ledgerStore = useLedgerStore();

const trip = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
const expenses = computed(() => (trip.value ? ledgerStore.expenses(trip.value.id) : []));
const budget = computed(() => trip.value
  ? budgetStatus(trip.value, dayPlanStore.dayPlans, spotStore.spots, expenses.value)
  : { spent: 0, remaining: 0, warning: '', itineraryCost: 0 });
const settlement = useLedgerSettlement(trip, expenses);

const selectedDate = ref(trip.value?.start_date || new Date().toISOString().slice(0, 10));
const dayBudget = computed(() => trip.value ? dayBudgetStatus(trip.value, expenses.value, selectedDate.value) : { dailyBudget: 0, spent: 0, remaining: 0 });

const newMember = ref('');
const formRef = ref<InstanceType<typeof ExpenseForm>>();
const editingPendingId = ref<string | null>(null);
function addMember() {
  if (!trip.value) return;
  const name = newMember.value.trim();
  if (!name) return;
  if (trip.value.members.includes(name)) {
    toast.warn(messages.memberExists);
    return;
  }
  trip.value.members.push(name);
  tripStore.persist?.();
  newMember.value = '';
  toast.ok(messages.memberAdded);
}
function removeMember(name: string) {
  if (!trip.value) return;
  trip.value.members = trip.value.members.filter((item) => item !== name);
  tripStore.persist?.();
}

function onSubmit(draft: ExpenseDraft) {
  if (!trip.value) return;
  ledgerStore.submitExpense(trip.value.id, draft, trip.value.members, editingPendingId.value || undefined);
  editingPendingId.value = null;
}
function editPending(pendingId: string) {
  if (!trip.value) return;
  const entry = ledgerStore.pending(trip.value.id).find((item) => item.id === pendingId);
  if (!entry) return;
  editingPendingId.value = pendingId;
  formRef.value?.loadDraft({
    title: entry.title,
    category: entry.category,
    amountRaw: entry.amountRaw,
    payer: entry.payer,
    participants: [...entry.participants],
    date: entry.date,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>
<style scoped>
.over { color: #c0392b; font-weight: 600; }
</style>
