import type { SplitPlan } from "../types";
import { addMonths } from "./date";

export function createSplitPlans(params: {
  productEntryId: string;
  amountWithTax: number;
  months: number;
  startMonth: string;
  memo: string;
}): SplitPlan[] {
  const baseAmount = Math.floor(params.amountWithTax / params.months);
  const remainder = params.amountWithTax - baseAmount * params.months;

  return Array.from({ length: params.months }, (_, index) => {
    const isLastMonth = index === params.months - 1;

    return {
      id: crypto.randomUUID(),
      productEntryId: params.productEntryId,
      targetMonth: addMonths(params.startMonth, index),
      allocatedAmount: baseAmount + (isLastMonth ? remainder : 0),
      status: "pending",
      memo: params.memo,
    };
  });
}
