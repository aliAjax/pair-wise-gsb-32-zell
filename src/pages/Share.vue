<template>
  <main class="page">
    <template v-if="trip">
      <TripHeader :trip="trip" />
      <div class="toolbar">
        <el-button @click="router.push('/trip/' + trip.id + '/ledger')">查看账本</el-button>
      </div>
      <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />
      <ExpenseList :expenses="expenses" :currency="trip.currency" />
      <SettlementPanel :view="settlement" :currency="trip.currency" />
      <el-button @click="copyText">复制行程文本</el-button>
    </template>
    <EmptyState v-else title="旅行不存在" description="请先创建旅行并在详情页进入分享预览。" />
  </main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useLedgerStore } from '../stores/ledgerStore';
import { useLedgerSettlement } from '../hooks/useLedgerSettlement';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import ExpenseList from '../components/common/ExpenseList.vue';
import SettlementPanel from '../components/common/SettlementPanel.vue';
import EmptyState from '../components/common/EmptyState.vue';
const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const ledgerStore = useLedgerStore();
const trip = computed(() => {
  const id = route.params.id;
  return tripStore.trips.find((item) => item.id === id) || tripStore.trips[0];
});
const tripDays = computed(() => trip.value ? dayPlanStore.dayPlans.filter((day) => day.trip_id === trip.value!.id) : []);
const expenses = computed(() => (trip.value ? ledgerStore.expenses(trip.value.id) : []));
const settlement = useLedgerSettlement(trip, expenses);
function copyText() { navigator.clipboard?.writeText('TripWeaver 行程单：' + (trip.value?.title || '未命名')); }
</script>
