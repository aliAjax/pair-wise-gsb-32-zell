import dayjs from 'dayjs';
import { SpotCategory } from '../constants/spot';
import { TripStatus } from '../constants/trip';
import { ExpenseCategory } from '../constants/ledger';

export const spotCategoryText: Record<SpotCategory, string> = {
  [SpotCategory.NATURE]: '自然风光',
  [SpotCategory.CULTURE]: '人文历史',
  [SpotCategory.FOOD]: '美食购物',
  [SpotCategory.ENTERTAINMENT]: '娱乐休闲',
};
export const tripStatusText: Record<TripStatus, string> = {
  [TripStatus.PLANNING]: '规划中',
  [TripStatus.ONGOING]: '进行中',
  [TripStatus.FINISHED]: '已结束',
};
export const expenseCategoryText: Record<ExpenseCategory, string> = {
  [ExpenseCategory.TRANSPORT]: '交通',
  [ExpenseCategory.LODGING]: '住宿',
  [ExpenseCategory.FOOD]: '餐饮',
  [ExpenseCategory.TICKET]: '门票',
  [ExpenseCategory.SHOPPING]: '购物',
  [ExpenseCategory.OTHER]: '其他',
};
export const transportText: Record<string, string> = { walk: '步行', metro: '地铁', taxi: '出租', train: '火车' };
export const formatDate = (value: string) => dayjs(value).format('YYYY-MM-DD');
export const formatCurrency = (value: number, currency = 'CNY') => new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(value);
/** 不带货币符号的两位小数金额，账本表格更紧凑 */
export const formatAmount = (value: number) => (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
/** 结欠文案：正数应收、负数应付、0 已平 */
export const formatBalanceText = (net: number) => {
  if (net > 0) return `应收 ${formatAmount(net)}`;
  if (net < 0) return `应付 ${formatAmount(-net)}`;
  return '已结清';
};
