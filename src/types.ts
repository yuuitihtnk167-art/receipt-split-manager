export type InputMethod = "normal" | "split";

export type PlanStatus = "pending" | "done";

export type ProductEntry = {
  id: string;
  purchaseDate: string;
  storeName: string;
  receiptItemName: string;
  officialItemName: string;
  amountWithTax: number;
  category: string;
  inputMethod: InputMethod;
  createdAt: string;
  updatedAt: string;
};

export type SplitSetting = {
  productEntryId: string;
  months: number;
  startMonth: string;
  rounding: "last_month_adjust";
  memo: string;
};

export type SplitPlan = {
  id: string;
  productEntryId: string;
  targetMonth: string;
  allocatedAmount: number;
  status: PlanStatus;
  memo: string;
};

export type AppData = {
  productEntries: ProductEntry[];
  splitSettings: SplitSetting[];
  splitPlans: SplitPlan[];
};

export type ProductFormValues = {
  purchaseDate: string;
  storeName: string;
  receiptItemName: string;
  officialItemName: string;
  amountWithTax: string;
  category: string;
  inputMethod: InputMethod;
  splitMonths: string;
  splitStartMonth: string;
  splitMemo: string;
};
