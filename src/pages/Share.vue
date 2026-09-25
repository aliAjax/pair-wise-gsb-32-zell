<template>
  <main class="page">
    <template v-if="trip">
      <TripHeader :trip="trip" />
      <DayTimeline v-for="day in tripDays" :key="day.id" :day="day" :spots="spotStore.spots" />
      <section class="share-ledger">
        <h2>账单结算</h2>
        <p class="muted">分享页与详情页展示同一套余额和个人结欠。</p>
        <LedgerPanel :trip="tripRef" :day-plans="dayPlanStore.dayPlans" :spots="spotStore.spots" readonly />
      </section>
      <div class="toolbar">
        <el-button @click="copyText">复制行程文本</el-button>
      </div>
    </template>
    <EmptyState v-else title="旅行不存在" :description="messages.ledgerTripMissing" />
  </main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { messages } from '../constants/messages';
import TripHeader from '../components/common/TripHeader.vue';
import DayTimeline from '../components/common/DayTimeline.vue';
import EmptyState from '../components/common/EmptyState.vue';
import LedgerPanel from '../components/ledger/LedgerPanel.vue';

const route = useRoute();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
// 支持 /share?id=xxx 指定旅行，缺省回退第一个旅行
const tripRef = computed(() => {
  const id = route.query.id as string | undefined;
  return tripStore.trips.find((item) => item.id === id) || tripStore.trips[0];
});
const trip = tripRef;
const tripDays = computed(() => (tripRef.value ? dayPlanStore.dayPlans.filter((day) => day.trip_id === tripRef.value!.id) : []));
function copyText() { navigator.clipboard?.writeText('TripWeaver 行程单：' + (tripRef.value?.title || '未命名')); }
</script>
<style scoped>
.share-ledger { margin-top: 24px; }
</style>
