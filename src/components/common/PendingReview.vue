<template>
  <section class="band pending-band">
    <h3>待核对区（{{ pending.length }}）</h3>
    <EmptyState v-if="!pending.length" title="没有待核对条目" :description="messages.pendingEmpty" />
    <ul v-else class="pending-list">
      <li v-for="entry in pending" :key="entry.id">
        <div class="pending-main">
          <strong>{{ entry.title || '（未填写说明）' }}</strong>
          <span class="muted">金额「{{ entry.amountRaw || '空' }}」· 付款人「{{ entry.payer || '空' }}」· {{ entry.date || '未选日期' }}</span>
          <p class="reasons">
            <el-tag v-for="reason in entry.reasons" :key="reason" type="warning" size="small">{{ reason }}</el-tag>
          </p>
        </div>
        <div class="toolbar">
          <el-button size="small" @click="$emit('edit', entry.id)">修正后重提</el-button>
          <el-button size="small" type="danger" plain @click="$emit('remove', entry.id)">移除</el-button>
        </div>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import type { PendingExpense } from '../../models/ledger';
import EmptyState from './EmptyState.vue';
import { messages } from '../../constants/messages';

defineProps<{ pending: PendingExpense[] }>();
defineEmits<{ edit: [id: string]; remove: [id: string] }>();
</script>
<style scoped>
.pending-band { border-color: #e6c76a; background: #fffbe9; }
.pending-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.pending-list li { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.reasons { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 0; }
</style>
