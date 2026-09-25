<template>
  <main class="page" v-if="trip">
    <TripHeader :trip="trip" />
    <div class="toolbar">
      <el-button @click="router.push('/trip/' + trip.id)">返回详情</el-button>
      <el-button @click="router.push('/share')">分享预览</el-button>
      <el-tag>{{ pendingCount }} 条待核对</el-tag>
    </div>

    <el-alert v-if="!trip.members.length" :title="messages.noMembers" type="error" :closable="false" show-icon />

    <template v-else>
      <h2>记一笔垫付</h2>
      <ExpenseForm :members="trip.members" @submit="onSubmit" />
      <LedgerPanel
        :trip="tripRef"
        :day-plans="dayPlanStore.dayPlans"
        :spots="spotStore.spots"
      />
    </template>
  </main>
  <main v-else class="page"><EmptyState title="旅行不存在" :description="messages.ledgerTripMissing" /></main>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTripStore } from '../stores/tripStore';
import { useSpotStore } from '../stores/spotStore';
import { useDayPlanStore } from '../stores/dayPlanStore';
import { useLedgerStore } from '../stores/ledgerStore';
import type { LedgerDraft } from '../models/ledger';
import { messages } from '../constants/messages';
import TripHeader from '../components/common/TripHeader.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ExpenseForm from '../components/ledger/ExpenseForm.vue';
import LedgerPanel from '../components/ledger/LedgerPanel.vue';

const route = useRoute();
const router = useRouter();
const tripStore = useTripStore();
const spotStore = useSpotStore();
const dayPlanStore = useDayPlanStore();
const ledgerStore = useLedgerStore();

const tripRef = computed(() => tripStore.trips.find((item) => item.id === route.params.id));
const trip = tripRef;
const pendingCount = computed(() => (tripRef.value ? ledgerStore.tripPending(tripRef.value.id).length : 0));

function onSubmit(draft: LedgerDraft) {
  if (tripRef.value) ledgerStore.submitExpense(tripRef.value.id, tripRef.value.members, draft);
}
</script>
