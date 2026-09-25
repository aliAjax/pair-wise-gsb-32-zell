<template>
  <section class="ledger-balances band">
    <h3>个人结欠</h3>
    <el-table :data="balances" size="small" stripe>
      <el-table-column prop="member" label="成员" />
      <el-table-column label="垫付" align="right">
        <template #default="{ row }">{{ formatAmount(row.paid) }}</template>
      </el-table-column>
      <el-table-column label="应摊" align="right">
        <template #default="{ row }">{{ formatAmount(row.share) }}</template>
      </el-table-column>
      <el-table-column label="结欠" align="right">
        <template #default="{ row }">
          <el-tag :type="row.net > 0 ? 'success' : row.net < 0 ? 'danger' : 'info'">
            {{ formatBalanceText(row.net) }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <h3>最少转账建议</h3>
    <EmptyState v-if="!transfers.length && hasExpenses" title="全部结清" :description="messages.settled" />
    <p v-else-if="!transfers.length" class="muted">入账后这里会给出最少转账建议。</p>
    <ul v-else class="transfer-list">
      <li v-for="(item, index) in transfers" :key="index" class="transfer-item">
        <span><strong>{{ item.from }}</strong> 转给 <strong>{{ item.to }}</strong></span>
        <span class="amount">{{ formatCurrency(item.amount, currency) }}</span>
        <el-button v-if="!readonly" type="primary" size="small" @click="$emit('pay', item)">已转账</el-button>
      </li>
    </ul>
    <p v-if="settledTotal > 0" class="muted">已登记转账 {{ formatCurrency(settledTotal, currency) }}</p>
  </section>
</template>
<script setup lang="ts">
import type { MemberBalance, SettlementTransfer } from '../../models/ledger';
import { formatAmount, formatBalanceText, formatCurrency } from '../../utils/formatters';
import { messages } from '../../constants/messages';
import EmptyState from '../common/EmptyState.vue';

defineProps<{
  balances: MemberBalance[];
  transfers: SettlementTransfer[];
  settledTotal: number;
  hasExpenses: boolean;
  currency: string;
  readonly?: boolean;
}>();
defineEmits<{ pay: [transfer: SettlementTransfer] }>();
</script>
<style scoped>
h3 { margin: 16px 0 8px; }
.transfer-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.transfer-item { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #dbe7cf; border-radius: 6px; padding: 8px 12px; flex-wrap: wrap; }
.transfer-item .amount { margin-left: auto; font-weight: 600; color: #2d7a46; }
</style>
