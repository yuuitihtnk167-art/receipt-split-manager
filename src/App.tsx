import { useMemo, useState } from "react";
import { ProductForm } from "./components/ProductForm";
import { MonthlySummary } from "./components/MonthlySummary";
import { MonthlyPlans } from "./components/MonthlyPlans";
import { ProductList } from "./components/ProductList";
import { LearningDictionary } from "./components/LearningDictionary";
import { Tabs } from "./components/Tabs";
import { emptyAppData, loadAppData, saveAppData } from "./storage";
import type {
  AppData,
  LearningCandidate,
  PlanStatus,
  ProductEntry,
  ProductFormValues,
  SplitSetting,
} from "./types";
import { getTodayDate } from "./utils/date";
import { parseMoney } from "./utils/money";
import { createSplitPlans } from "./utils/split";

const tabs = [
  { id: "today", label: "今月" },
  { id: "input", label: "商品入力" },
  { id: "plans", label: "月別予定" },
  { id: "products", label: "商品一覧" },
  { id: "dictionary", label: "学習辞書" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [data, setData] = useState<AppData>(() => {
    if (typeof localStorage === "undefined") {
      return emptyAppData;
    }

    return loadAppData();
  });

  const productsById = useMemo(() => {
    return new Map(data.productEntries.map((product) => [product.id, product]));
  }, [data.productEntries]);

  function updateData(nextData: AppData): void {
    setData(nextData);
    saveAppData(nextData);
  }

  function handleSubmitProduct(values: ProductFormValues): void {
    const now = new Date().toISOString();
    const amountWithTax = parseMoney(values.amountWithTax);
    const productEntry: ProductEntry = {
      id: crypto.randomUUID(),
      purchaseDate: values.purchaseDate,
      storeName: values.storeName.trim(),
      receiptItemName: values.receiptItemName.trim(),
      officialItemName: values.officialItemName.trim(),
      amountWithTax,
      category: values.category.trim(),
      inputMethod: values.inputMethod,
      createdAt: now,
      updatedAt: now,
    };

    const splitMonths = Number(values.splitMonths);
    const splitSetting: SplitSetting | null =
      values.inputMethod === "split"
        ? {
            productEntryId: productEntry.id,
            months: splitMonths,
            startMonth: values.splitStartMonth,
            rounding: "last_month_adjust",
            memo: values.splitMemo.trim(),
          }
        : null;

    const splitPlans =
      splitSetting === null
        ? []
        : createSplitPlans({
            productEntryId: productEntry.id,
            amountWithTax,
            months: splitSetting.months,
            startMonth: splitSetting.startMonth,
            memo: splitSetting.memo,
          });

    const learningCandidates = upsertLearningCandidate(data.learningCandidates, productEntry);

    updateData({
      productEntries: [productEntry, ...data.productEntries],
      splitSettings: splitSetting ? [splitSetting, ...data.splitSettings] : data.splitSettings,
      splitPlans: [...splitPlans, ...data.splitPlans],
      learningCandidates,
    });

    setActiveTab(values.inputMethod === "split" ? "today" : "products");
  }

  function handleTogglePlanStatus(planId: string, status: PlanStatus): void {
    updateData({
      ...data,
      splitPlans: data.splitPlans.map((plan) =>
        plan.id === planId ? { ...plan, status } : plan,
      ),
    });
  }

  function handleDeleteLearningCandidate(candidateId: string): void {
    updateData({
      ...data,
      learningCandidates: data.learningCandidates.filter(
        (candidate) => candidate.id !== candidateId,
      ),
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">生活コスト配分メモ</p>
          <h1>receipt-split-manager</h1>
        </div>
        <p className="storage-note">この端末のブラウザに保存されます</p>
      </header>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <main>
        {activeTab === "today" && (
          <MonthlySummary
            plans={data.splitPlans}
            productsById={productsById}
            onToggleStatus={handleTogglePlanStatus}
          />
        )}

        {activeTab === "input" && (
          <ProductForm
            learningCandidates={data.learningCandidates}
            onSubmit={handleSubmitProduct}
          />
        )}

        {activeTab === "plans" && (
          <MonthlyPlans
            plans={data.splitPlans}
            productsById={productsById}
            onToggleStatus={handleTogglePlanStatus}
          />
        )}

        {activeTab === "products" && (
          <ProductList products={data.productEntries} splitSettings={data.splitSettings} />
        )}

        {activeTab === "dictionary" && (
          <LearningDictionary
            candidates={data.learningCandidates}
            onDelete={handleDeleteLearningCandidate}
          />
        )}
      </main>
    </div>
  );
}

function upsertLearningCandidate(
  candidates: LearningCandidate[],
  productEntry: ProductEntry,
): LearningCandidate[] {
  const today = getTodayDate();
  const existing = candidates.find(
    (candidate) =>
      candidate.receiptItemName === productEntry.receiptItemName &&
      candidate.officialItemName === productEntry.officialItemName &&
      candidate.category === productEntry.category &&
      candidate.storeName === productEntry.storeName,
  );

  if (!existing) {
    const priceBand = createPriceBand(productEntry.amountWithTax);

    return [
      {
        id: crypto.randomUUID(),
        receiptItemName: productEntry.receiptItemName,
        officialItemName: productEntry.officialItemName,
        category: productEntry.category,
        storeName: productEntry.storeName,
        priceMin: priceBand.min,
        priceMax: priceBand.max,
        confirmedCount: 1,
        lastUsedDate: today,
      },
      ...candidates,
    ];
  }

  return candidates.map((candidate) => {
    if (candidate.id !== existing.id) {
      return candidate;
    }

    return {
      ...candidate,
      priceMin: Math.min(candidate.priceMin, productEntry.amountWithTax),
      priceMax: Math.max(candidate.priceMax, productEntry.amountWithTax),
      confirmedCount: candidate.confirmedCount + 1,
      lastUsedDate: today,
    };
  });
}

function createPriceBand(amount: number): { min: number; max: number } {
  if (amount < 1000) {
    return { min: 0, max: 999 };
  }

  if (amount < 10000) {
    return { min: Math.floor(amount / 1000) * 1000, max: Math.floor(amount / 1000) * 1000 + 999 };
  }

  return {
    min: Math.floor(amount / 10000) * 10000,
    max: Math.floor(amount / 10000) * 10000 + 9999,
  };
}

export default App;
