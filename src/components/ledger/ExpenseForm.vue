<template>
  <form class="expense-form band" @submit.prevent="submit">
    <div class="form-row">
      <label>付款人</label>
      <el-select v-model="form.payer" :placeholder="members.length ? '选择付款人' : '暂无成员'" filterable style="width: 100%">
        <el-option v-for="member in members" :key="member" :label="member" :value="member" />
      </el-select>
    </div>
    <div class="form-row">
      <label>参与人（均摊）</label>
      <el-select
        v-model="form.participants"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="选择参与人，至少 1 人"
        style="width: 100%"
      >
        <el-option v-for="member in members" :key="member" :label="member" :value="member" />
      </el-select>
      <el-button link type="primary" size="small" @click="toggleAll">全选/清空</el-button>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>金额（元）</label>
        <el-input v-model="amountText" placeholder="如 128.50" inputmode="decimal" />
      </div>
      <div class="form-row">
        <label>类别</label>
        <el-select v-model="form.category" style="width: 100%">
          <el-option v-for="item in EXPENSE_CATEGORY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="form-row">
        <label>日期</label>
        <el-date-picker
          v-model="form.spent_date"
          type="date"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 100%"
        />
      </div>
    </div>
    <div class="form-row">
      <label>备注（可选）</label>
      <el-input v-model="form.note" placeholder="如 西湖边午饭" maxlength="50" />
    </div>
    <el-alert v-if="amountError" :title="amountError" type="error" :closable="false" show-icon />
    <div class="toolbar">
      <el-button type="primary" native-type="submit" :disabled="!members.length">记下这笔垫付</el-button>
    </div>
  </form>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { LedgerDraft } from '../../models/ledger';
import { ExpenseCategory, EXPENSE_CATEGORY_OPTIONS } from '../../constants/ledger';
import { messages } from '../../constants/messages';
import { parseAmount } from '../../utils/validators';

const props = defineProps<{ members: string[] }>();
const emit = defineEmits<{ submit: [draft: LedgerDraft] }>();

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const form = reactive<LedgerDraft>({
  payer: '',
  participants: [],
  category: ExpenseCategory.FOOD,
  amount: 0,
  spent_date: today(),
  note: '',
});
const amountText = ref('');
const amountError = ref('');

function toggleAll() {
  form.participants = form.participants.length === props.members.length ? [] : [...props.members];
}

function submit() {
  const amount = parseAmount(amountText.value);
  if (amount === null) {
    const text = amountText.value.trim();
    if (!text) amountError.value = messages.expenseAmountRequired;
    else if (Number(text) <= 0) amountError.value = messages.expenseAmountPositive;
    else amountError.value = messages.expenseAmountPrecision;
    return;
  }
  amountError.value = '';
  form.amount = amount;
  emit('submit', { ...form, participants: [...form.participants] });
  amountText.value = '';
  form.note = '';
}
</script>
<style scoped>
.expense-form { margin: 12px 0; }
.form-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.form-row label { font-size: 13px; color: #4a5a50; }
.form-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
</style>
