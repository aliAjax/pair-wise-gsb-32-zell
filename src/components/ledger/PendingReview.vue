<template>
  <section class="pending-review band">
    <h3>待核对区（{{ pending.length }}）</h3>
    <EmptyState v-if="!pending.length" title="没有待核对条目" :description="messages.emptyPending" />
    <article v-for="item in pending" :key="item.id" class="pending-item">
      <header class="pending-head">
        <strong>{{ item.note || '未命名花销' }}</strong>
        <el-tag type="warning">待核对</el-tag>
      </header>
      <p class="muted">
        付款人：{{ item.payer || '（空）' }} · 参与人：{{ item.participants.join('、') || '（空）' }} ·
        金额：{{ item.amount || '（空）' }} · 日期：{{ item.spent_date || '（空）' }}
      </p>
      <ul class="reasons">
        <li v-for="(reason, index) in item.reasons" :key="index">⚠️ {{ reason }}</li>
      </ul>

      <el-dialog v-model="editing" title="修正待核对条目" width="min(520px, 92vw)">
        <div class="form-grid">
          <div class="form-row">
            <label>付款人</label>
            <el-select v-model="draft.payer" filterable style="width: 100%">
              <el-option v-for="member in members" :key="member" :label="member" :value="member" />
            </el-select>
          </div>
          <div class="form-row">
            <label>参与人</label>
            <el-select v-model="draft.participants" multiple collapse-tags style="width: 100%">
              <el-option v-for="member in members" :key="member" :label="member" :value="member" />
            </el-select>
          </div>
          <div class="form-row">
            <label>金额（元）</label>
            <el-input v-model="amountText" placeholder="正数，最多两位小数" inputmode="decimal" />
          </div>
          <div class="form-row">
            <label>类别</label>
            <el-select v-model="draft.category" style="width: 100%">
              <el-option v-for="option in EXPENSE_CATEGORY_OPTIONS" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </div>
          <div class="form-row">
            <label>日期</label>
            <el-date-picker v-model="draft.spent_date" type="date" value-format="YYYY-MM-DD" :clearable="false" style="width: 100%" />
          </div>
          <div class="form-row">
            <label>备注</label>
            <el-input v-model="draft.note" maxlength="50" />
          </div>
        </div>
        <template #footer>
          <el-button @click="editing = false">取消</el-button>
          <el-button type="primary" @click="resubmit(item.id)">修正后重新入账</el-button>
        </template>
      </el-dialog>

      <div class="toolbar">
        <el-button size="small" type="primary" @click="openEdit(item)">修正</el-button>
        <el-button size="small" @click="$emit('discard', item.id)">丢弃</el-button>
      </div>
    </article>
  </section>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { LedgerDraft, PendingExpense } from '../../models/ledger';
import { ExpenseCategory, EXPENSE_CATEGORY_OPTIONS } from '../../constants/ledger';
import { messages } from '../../constants/messages';
import { parseAmount } from '../../utils/validators';
import EmptyState from '../common/EmptyState.vue';

const props = defineProps<{ pending: PendingExpense[]; members: string[] }>();
const emit = defineEmits<{
  resubmit: [pendingId: string, draft: LedgerDraft];
  discard: [pendingId: string];
}>();

const editing = ref(false);
const amountText = ref('');
const draft = reactive<LedgerDraft>({
  payer: '',
  participants: [],
  category: ExpenseCategory.OTHER,
  amount: 0,
  spent_date: '',
  note: '',
});

function openEdit(item: PendingExpense) {
  draft.payer = item.payer;
  draft.participants = [...item.participants];
  draft.category = EXPENSE_CATEGORY_OPTIONS.some((option) => option.value === item.category)
    ? (item.category as ExpenseCategory)
    : ExpenseCategory.OTHER;
  draft.amount = typeof item.amount === 'number' && isFinite(item.amount) ? item.amount : 0;
  amountText.value = item.amount ? String(item.amount) : '';
  draft.spent_date = item.spent_date;
  draft.note = item.note;
  editing.value = true;
}

function resubmit(pendingId: string) {
  const amount = parseAmount(amountText.value);
  draft.amount = amount ?? 0;
  emit('resubmit', pendingId, { ...draft, participants: [...draft.participants] });
  if (!props.pending.some((item) => item.id === pendingId)) editing.value = false;
}
</script>
<style scoped>
.pending-item { border: 1px dashed #d8a13a; border-radius: 8px; padding: 12px 16px; margin-top: 12px; background: #fffaf0; }
.pending-head { display: flex; align-items: center; justify-content: space-between; }
.reasons { margin: 8px 0 0; padding-left: 4px; list-style: none; color: #b25d00; font-size: 13px; }
.form-grid { display: grid; gap: 4px 16px; grid-template-columns: 1fr 1fr; }
.form-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.form-row label { font-size: 13px; color: #4a5a50; }
h3 { margin: 0 0 8px; }
</style>
