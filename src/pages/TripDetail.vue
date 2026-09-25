<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/spots')">添加景点</el-button>
      <el-button @click="router.push('/planner/' + trip.id + '/1')">编排第 1 天</el-button>
      <el-button type="success" @click="router.push('/trip/' + trip.id + '/ledger')">旅行账本</el-button>
      <el-button @click="router.push('/share/' + trip.id)">分享预览</el-button>
    </div>
    <section class="grid">
      <BudgetChart :spent="stats.value.budget.spent" :remaining="stats.value.budget.remaining" />
      <div class="band">
        <strong>统计</strong>
        <p>天数 {{ stats.value.days }} · 景点 {{ stats.value.spotCount }}</p>
        <p>已入账花销 {{ formatCurrency(stats.value.budget.spent, trip.currency) }} · 剩余预算 {{ formatCurrency(stats.value.budget.remaining, trip.currency) }}</p>
        <p class="muted">行程景点计划金额 {{ formatCurrency(stats.value.budget.itineraryCost, trip.currency) }}（参考，不重复扣预算）</p>
        <p class="muted">{{ stats.value.budget.warning }}</p>
      </div>
    </section>
    <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />
    <SettlementPanel :view="settlement" :currency="trip.currency" />
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" /></main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useLedgerStore } from '../stores/ledgerStore';
import { useTripStats } from '../hooks/useTripStats';
import { useLedgerSettlement } from '../hooks/useLedgerSettlement';
import { formatCurrency } from '../utils/formatters';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import BudgetChart from '../components/common/BudgetChart.vue';
import SettlementPanel from '../components/common/SettlementPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const ledgerStore = useLedgerStore();
const trip = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
const tripDays = computed(() => dayPlanStore.dayPlans.filter((day) => day.trip_id === route.params.id));
const expenses = computed(() => (trip.value ? ledgerStore.expenses(trip.value.id) : []));
const stats = computed(() => trip.value ? useTripStats(trip.value, dayPlanStore.dayPlans, spotStore.spots, expenses.value) : { value: { days: 0, spotCount: 0, budget: { spent: 0, remaining: 0, warning: '', itineraryCost: 0 } } });
const settlement = useLedgerSettlement(trip, expenses);
</script>
