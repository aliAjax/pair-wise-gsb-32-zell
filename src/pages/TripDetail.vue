<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button type="primary" @click="router.push('/spots')">添加景点</el-button>
      <el-button @click="router.push('/planner/' + trip.id + '/1')">编排第 1 天</el-button>
      <el-button type="success" @click="router.push('/ledger/' + trip.id)">旅行账本</el-button>
      <el-button @click="router.push('/share')">分享预览</el-button>
    </div>
    <section class="grid">
      <BudgetChart :spent="ledger.budget.spent" :remaining="ledger.budget.remaining" />
      <div class="band">
        <strong>统计</strong>
        <p>天数 {{ stats.value.days }} · 景点 {{ stats.value.spotCount }}</p>
        <p>入账花销 {{ formatCurrency(ledger.budget.ledger, trip.currency) }} · 剩余预算 {{ formatCurrency(ledger.budget.remaining, trip.currency) }}</p>
        <p v-if="ledger.pending.length" class="pending-link" @click="router.push('/ledger/' + trip.id)">
          ⚠️ {{ ledger.pending.length }} 条待核对，前往处理
        </p>
        <p class="muted">{{ ledger.budget.warning }}</p>
      </div>
    </section>
    <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />

    <LedgerPanel
      :trip="tripRef"
      :day-plans="dayPlanStore.dayPlans"
      :spots="spotStore.spots"
    />
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
import { useLedger } from '../hooks/useLedger';
import { formatCurrency } from '../utils/formatters';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import BudgetChart from '../components/common/BudgetChart.vue';
import EmptyState from '../components/common/EmptyState.vue';
import LedgerPanel from '../components/ledger/LedgerPanel.vue';
const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const ledgerStore = useLedgerStore();
const tripRef = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
const trip = tripRef;
const tripDays = computed(() => dayPlanStore.dayPlans.filter((day) => day.trip_id === route.params.id));
const ledger = useLedger(tripRef, dayPlanStore.dayPlans, spotStore.spots);
const stats = computed(() => trip.value ? useTripStats(trip.value, dayPlanStore.dayPlans, spotStore.spots, ledgerStore.expenses) : { value: { days: 0, spotCount: 0, budget: { spent: 0, remaining: 0, warning: '' } } });
</script>
<style scoped>
.pending-link { color: #b25d00; cursor: pointer; text-decoration: underline; }
</style>
