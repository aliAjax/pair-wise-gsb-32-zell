<template>
  <section class="band ledger-panel">
    <h3>账本结算</h3>
    <p class="muted">入账花销合计 {{ formatCurrency(view.total, currency) }} · 按人头均摊，精确到分</p>

    <div v-if="!view.balances.length" class="muted">还没有可结算的花销。</div>

    <table v-else class="ledger-table">
      <thead>
        <tr><th>成员</th><th>垫付</th><th>应承担</th><th>个人结欠</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in view.balances" :key="row.member">
          <td>{{ row.member }}</td>
          <td>{{ formatAmount(row.paid) }}</td>
          <td>{{ formatAmount(row.share) }}</td>
          <td>
            <el-tag v-if="row.net > 0" type="success">应收 {{ formatAmount(row.net) }}</el-tag>
            <el-tag v-else-if="row.net < 0" type="danger">应付 {{ formatAmount(Math.abs(row.net)) }}</el-tag>
            <el-tag v-else type="info">已结清</el-tag>
          </td>
        </tr>
      </tbody>
    </table>

    <template v-if="view.transfers.length">
      <h4>最少转账建议（{{ view.transfers.length }} 笔）</h4>
      <ol class="transfer-list">
        <li v-for="(advice, index) in view.transfers" :key="index">
          <strong>{{ advice.from }}</strong>
          转给
          <strong>{{ advice.to }}</strong>
          <span class="amount">{{ formatCurrency(advice.amount, currency) }}</span>
        </li>
      </ol>
    </template>
    <p v-else-if="view.balances.length" class="muted">无需转账，所有人已结清。</p>
  </section>
</template>
<script setup lang="ts">
import type { LedgerSettlementView } from '../../hooks/useLedgerSettlement';
import { formatAmount, formatCurrency } from '../../utils/formatters';

defineProps<{ view: LedgerSettlementView; currency?: string }>();
</script>
<style scoped>
.ledger-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
.ledger-table th, .ledger-table td { padding: 8px 10px; border-bottom: 1px solid #e3eadb; text-align: left; }
.transfer-list { padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.transfer-list .amount { color: #2d7a46; font-weight: 600; margin-left: 8px; }
</style>
