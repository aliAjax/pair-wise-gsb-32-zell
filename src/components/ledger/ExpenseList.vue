<template>
  <section class="expense-list">
    <h3>已入账花销（{{ expenses.length }}）</h3>
    <EmptyState v-if="!expenses.length" title="还没有账目" :description="messages.emptyExpenses" />
    <el-table v-else :data="expenses" size="small" stripe>
      <el-table-column prop="spent_date" label="日期" width="110" />
      <el-table-column label="类别" width="80">
        <template #default="{ row }">{{ expenseCategoryText[row.category as ExpenseCategory] || row.category }}</template>
      </el-table-column>
      <el-table-column label="付款人" width="90">
        <template #default="{ row }">{{ row.payer }}</template>
      </el-table-column>
      <el-table-column label="参与人">
        <template #default="{ row }">{{ row.participants.join('、') }}</template>
      </el-table-column>
      <el-table-column label="备注">
        <template #default="{ row }"><span class="muted">{{ row.note || '—' }}</span></template>
      </el-table-column>
      <el-table-column label="金额" align="right" width="110">
        <template #default="{ row }">{{ formatCurrency(row.amount, currency) }}</template>
      </el-table-column>
      <el-table-column v-if="!readonly" label="操作" width="80" align="center">
        <template #default="{ row }">
          <el-button link type="danger" size="small" @click="$emit('remove', row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
<script setup lang="ts">
import type { Expense } from '../../models/ledger';
import type { ExpenseCategory } from '../../constants/ledger';
import { expenseCategoryText, formatCurrency } from '../../utils/formatters';
import { messages } from '../../constants/messages';
import EmptyState from '../common/EmptyState.vue';

defineProps<{ expenses: Expense[]; currency: string; readonly?: boolean }>();
defineEmits<{ remove: [id: string] }>();
</script>
<style scoped>
h3 { margin: 16px 0 8px; }
</style>
