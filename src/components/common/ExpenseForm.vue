<template>
  <form class="band expense-form" @submit.prevent="submit">
    <h3>记一笔垫付</h3>
    <div class="form-row">
      <el-input v-model="draft.title" placeholder="花销说明，如：外婆家晚餐" />
    </div>
    <div class="form-grid">
      <el-select v-model="draft.category" placeholder="类别">
        <el-option v-for="item in EXPENSE_CATEGORY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-input v-model="draft.amountRaw" placeholder="金额（正数，最多两位小数）" inputmode="decimal" />
      <el-date-picker v-model="draft.date" type="date" value-format="YYYY-MM-DD" :disabled-date="disabledDate" placeholder="花销日期" />
      <el-select v-model="draft.payer" placeholder="付款人">
        <el-option v-for="name in members" :key="name" :label="name" :value="name" />
      </el-select>
    </div>
    <div class="form-row">
      <el-checkbox-group v-model="draft.participants">
        <el-checkbox v-for="name in members" :key="name" :value="name" :label="name" />
      </el-checkbox-group>
      <span class="muted">参与人按人头均摊</span>
    </div>
    <el-button type="primary" native-type="submit">提交入账</el-button>
  </form>
</template>
<script setup lang="ts">
import { reactive } from 'vue';
import dayjs from 'dayjs';
import type { ExpenseDraft } from '../../utils/expenseValidator';
import { EXPENSE_CATEGORY_OPTIONS } from '../../constants/ledger';

const props = defineProps<{ members: string[]; defaultDate: string; minDate?: string; maxDate?: string }>();
const emit = defineEmits<{ submit: [draft: ExpenseDraft] }>();

const draft = reactive<ExpenseDraft>({
  title: '',
  category: '',
  amountRaw: '',
  payer: '',
  participants: [],
  date: props.defaultDate,
});

/** 限制在旅行日期范围内（不传范围则不限制） */
function disabledDate(date: Date) {
  const current = dayjs(date);
  if (props.minDate && current.isBefore(dayjs(props.minDate), 'day')) return true;
  if (props.maxDate && current.isAfter(dayjs(props.maxDate), 'day')) return true;
  return false;
}

function reset() {
  draft.title = '';
  draft.category = '';
  draft.amountRaw = '';
  draft.payer = '';
  draft.participants = [];
}

function submit() {
  emit('submit', { ...draft, participants: [...draft.participants] });
  reset();
  draft.date = props.defaultDate;
}

/** 载入待核对条目供修正 */
function loadDraft(data: ExpenseDraft) {
  draft.title = data.title;
  draft.category = data.category;
  draft.amountRaw = data.amountRaw;
  draft.payer = data.payer;
  draft.participants = [...data.participants];
  draft.date = data.date || props.defaultDate;
}

defineExpose({ loadDraft });
</script>
<style scoped>
.expense-form { display: flex; flex-direction: column; gap: 12px; }
.form-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.form-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
</style>
