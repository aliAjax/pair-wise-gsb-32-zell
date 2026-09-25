<template>
  <section class="band">
    <h3>已入账花销（{{ expenses.length }}）</h3>
    <EmptyState v-if="!expenses.length" title="暂无入账" :description="messages.ledgerEmpty" />
    <ul v-else class="expense-list">
      <li v-for="expense in expenses" :key="expense.id">
        <div class="expense-main">
          <el-tag size="small">{{ expenseCategoryText[expense.category] }}</el-tag>
          <strong>{{ expense.title }}</strong>
          <span class="muted">{{ expense.date }} · {{ expense.payer }} 垫付</span>
        </div>
        <div class="expense-side">
          <span class="amount">{{ formatCurrency(expense.amount, currency) }}</span>
          <span class="muted split">参与 {{ expense.participants.length }} 人，每人 {{ formatAmount(perHead(expense)) }}<template v-if="hasRemainder(expense)">（尾差 {{ formatAmount(remainder(expense)) }} 由 {{ lastParticipant(expense) }} 承担）</template></span>
          <el-button v-if="editable" link type="danger" @click="$emit('remove', expense.id)">删除</el-button>
        </div>
      </li>
    </ul>
  </section>
</template>
<script setup lang="ts">
import type { Expense } from '../../models/ledger';
import type { ExpenseCategory } from '../../constants/ledger';
import { expenseCategoryText as categoryText, formatAmount, formatCurrency } from '../../utils/formatters';
import { splitExpense } from '../../utils/settlement';
import EmptyState from './EmptyState.vue';
import { messages } from '../../constants/messages';

const props = defineProps<{ expenses: Expense[]; currency?: string; editable?: boolean }>();
defineEmits<{ remove: [id: string] }>();

const expenseCategoryText = categoryText as Record<ExpenseCategory, string>;
/** 除不尽时每人的基础份额（向下取整到分） */
function perHead(expense: Expense) {
  const shares = splitExpense(expense);
  return Object.values(shares)[0] || 0;
}
function remainder(expense: Expense) {
  return expense.participants.length > 0 ? expense.amount - perHead(expense) * expense.participants.length : 0;
}
function hasRemainder(expense: Expense) {
  return Math.round(remainder(expense) * 100) > 0;
}
function lastParticipant(expense: Expense) {
  return expense.participants[expense.participants.length - 1];
}
</script>
<style scoped>
.expense-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.expense-list li { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-bottom: 10px; border-bottom: 1px dashed #dbe7cf; }
.expense-main { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.expense-side { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.amount { font-weight: 700; color: #2d7a46; }
.split { font-size: 12px; }
</style>
