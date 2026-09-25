<template>
  <section class="daily-budget band">
    <h3>逐日可用预算</h3>
    <el-table :data="daily.rows" size="small" stripe>
      <el-table-column prop="date" label="日期" />
      <el-table-column label="分摊预算" align="right">
        <template #default="{ row }">{{ formatAmount(row.allocated) }}</template>
      </el-table-column>
      <el-table-column label="当天入账" align="right">
        <template #default="{ row }">{{ formatAmount(row.spent) }}</template>
      </el-table-column>
      <el-table-column label="当天可用" align="right">
        <template #default="{ row }">
          <span :class="row.remaining < 0 ? 'over' : ''">{{ formatAmount(row.remaining) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <p v-if="daily.outsideSpent > 0" class="muted">
      行程日期之外另有入账 {{ formatCurrency(daily.outsideSpent, currency) }}，已计入总预算扣减。
    </p>
  </section>
</template>
<script setup lang="ts">
import { formatAmount, formatCurrency } from '../../utils/formatters';

defineProps<{
  daily: { rows: { date: string; allocated: number; spent: number; remaining: number }[]; outsideSpent: number };
  currency: string;
}>();
</script>
<style scoped>
h3 { margin: 0 0 8px; }
.over { color: #c23b3b; font-weight: 600; }
</style>
