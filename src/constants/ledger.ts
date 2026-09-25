export enum ExpenseCategory {
  TRANSPORT = 'transport',
  LODGING = 'lodging',
  FOOD = 'food',
  TICKET = 'ticket',
  SHOPPING = 'shopping',
  OTHER = 'other',
}
export const EXPENSE_CATEGORY_OPTIONS = [
  { label: '交通', value: ExpenseCategory.TRANSPORT },
  { label: '住宿', value: ExpenseCategory.LODGING },
  { label: '餐饮', value: ExpenseCategory.FOOD },
  { label: '门票', value: ExpenseCategory.TICKET },
  { label: '购物', value: ExpenseCategory.SHOPPING },
  { label: '其他', value: ExpenseCategory.OTHER },
];
