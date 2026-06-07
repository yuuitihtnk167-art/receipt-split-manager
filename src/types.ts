export type InputMethod = "normal" | "split";

export type PlanStatus = "pending" | "done";

export type CategoryItem = {
  id: string;
  name: string;
};

export type CategoryGroup = {
  id: string;
  name: string;
  subcategories: CategoryItem[];
};

export type ProductEntry = {
  id: string;
  purchaseDate: string;
  storeName: string;
  receiptItemName: string;
  officialItemName: string;
  amountWithTax: number;
  category: string;
  categoryMajor?: string;
  categoryMinor?: string;
  inputMethod: InputMethod;
  memo?: string;
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
  remainderStatus?: PlanStatus;
  memo: string;
};

export type AppData = {
  productEntries: ProductEntry[];
  splitSettings: SplitSetting[];
  splitPlans: SplitPlan[];
  categories: CategoryGroup[];
  migrationVersion?: number;
};

export type ProductFormValues = {
  purchaseDate: string;
  storeName: string;
  receiptItemName: string;
  officialItemName: string;
  amountWithTax: string;
  category: string;
  categoryMajor: string;
  categoryMinor: string;
  inputMethod: InputMethod;
  splitMonths: string;
  splitStartMonth: string;
  splitMemo: string;
};
