import { useMemo, useState } from "react";
import { ProductForm } from "./components/ProductForm";
import { MonthlySummary } from "./components/MonthlySummary";
import { MonthlyPlans } from "./components/MonthlyPlans";
import { ProductList } from "./components/ProductList";
import { DataManagement } from "./components/DataManagement";
import { Tabs } from "./components/Tabs";
import { emptyAppData, loadAppData, saveAppData } from "./storage";
import type {
  AppData,
  PlanStatus,
  ProductEntry,
  ProductFormValues,
  SplitSetting,
} from "./types";
import { parseMoney } from "./utils/money";
import { createSplitPlans } from "./utils/split";

const tabs = [
  { id: "today", label: "今月" },
  { id: "input", label: "商品入力" },
  { id: "plans", label: "月別予定" },
  { id: "products", label: "商品一覧" },
  { id: "data", label: "データ管理" },
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
  const settingsByProductId = useMemo(() => {
    return new Map(data.splitSettings.map((setting) => [setting.productEntryId, setting]));
  }, [data.splitSettings]);

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
      categoryMajor: values.categoryMajor,
      categoryMinor: values.categoryMinor,
      inputMethod: "split",
      memo: values.splitMemo.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const splitMonths = Number(values.splitMonths);
    const splitSetting: SplitSetting = {
      productEntryId: productEntry.id,
      months: splitMonths,
      startMonth: values.splitStartMonth,
      rounding: "last_month_adjust",
      memo: values.splitMemo.trim(),
    };
    const splitPlans = createSplitPlans({
      productEntryId: productEntry.id,
      amountWithTax,
      months: splitSetting.months,
      startMonth: splitSetting.startMonth,
      memo: splitSetting.memo,
    });

    updateData({
      productEntries: [productEntry, ...data.productEntries],
      splitSettings: [splitSetting, ...data.splitSettings],
      splitPlans: [...splitPlans, ...data.splitPlans],
      categories: data.categories,
    });

    setActiveTab("today");
  }

  function handleTogglePlanStatus(planId: string, status: PlanStatus): void {
    updateData({
      ...data,
      splitPlans: data.splitPlans.map((plan) =>
        plan.id === planId ? { ...plan, status } : plan,
      ),
    });
  }

  function handleToggleRemainderStatus(planId: string, status: PlanStatus): void {
    updateData({
      ...data,
      splitPlans: data.splitPlans.map((plan) =>
        plan.id === planId ? { ...plan, remainderStatus: status } : plan,
      ),
    });
  }

  function handleDeleteProduct(productId: string): void {
    updateData({
      ...data,
      productEntries: data.productEntries.filter((product) => product.id !== productId),
      splitSettings: data.splitSettings.filter((setting) => setting.productEntryId !== productId),
      splitPlans: data.splitPlans.filter((plan) => plan.productEntryId !== productId),
    });
  }

  function handleUpdateProduct(productId: string, values: ProductFormValues): void {
    const currentProduct = data.productEntries.find((product) => product.id === productId);

    if (!currentProduct) {
      return;
    }

    const amountWithTax = parseMoney(values.amountWithTax);
    const updatedProduct: ProductEntry = {
      ...currentProduct,
      purchaseDate: values.purchaseDate,
      storeName: values.storeName.trim(),
      receiptItemName: values.receiptItemName.trim(),
      officialItemName: values.officialItemName.trim(),
      amountWithTax,
      category: values.category.trim(),
      categoryMajor: values.categoryMajor,
      categoryMinor: values.categoryMinor,
      inputMethod: "split",
      memo: values.splitMemo.trim(),
      updatedAt: new Date().toISOString(),
    };

    const existingPlans = data.splitPlans.filter((plan) => plan.productEntryId === productId);
    const doneMonths = new Set(
      existingPlans
        .filter((plan) => plan.status === "done")
        .map((plan) => plan.targetMonth),
    );
    const doneRemainderMonths = new Set(
      existingPlans
        .filter((plan) => plan.remainderStatus === "done")
        .map((plan) => plan.targetMonth),
    );
    const splitMonths = Number(values.splitMonths);
    const nextSplitSetting: SplitSetting = {
      productEntryId: productId,
      months: splitMonths,
      startMonth: values.splitStartMonth,
      rounding: "last_month_adjust",
      memo: values.splitMemo.trim(),
    };
    const nextSplitPlans = createSplitPlans({
      productEntryId: productId,
      amountWithTax,
      months: nextSplitSetting.months,
      startMonth: nextSplitSetting.startMonth,
      memo: nextSplitSetting.memo,
    }).map((plan) => ({
      ...plan,
      status: doneMonths.has(plan.targetMonth) ? ("done" as const) : plan.status,
      remainderStatus: doneRemainderMonths.has(plan.targetMonth)
        ? ("done" as const)
        : plan.remainderStatus,
    }));

    updateData({
      productEntries: data.productEntries.map((product) =>
        product.id === productId ? updatedProduct : product,
      ),
      splitSettings: [
        nextSplitSetting,
        ...data.splitSettings.filter((setting) => setting.productEntryId !== productId),
      ],
      splitPlans: [
        ...nextSplitPlans,
        ...data.splitPlans.filter((plan) => plan.productEntryId !== productId),
      ],
      categories: data.categories,
    });
  }

  function handleImportData(importedData: AppData): void {
    updateData(importedData);
  }

  function handleUpdateCategories(categories: AppData["categories"]): void {
    updateData({
      ...data,
      categories,
    });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>家計簿分割入力支援アプリ</h1>
        </div>
        <p className="storage-note">この端末のブラウザに保存されます</p>
      </header>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <main>
        {activeTab === "today" && (
          <MonthlySummary
            plans={data.splitPlans}
            productsById={productsById}
            settingsByProductId={settingsByProductId}
            onToggleStatus={handleTogglePlanStatus}
            onToggleRemainderStatus={handleToggleRemainderStatus}
          />
        )}

        {activeTab === "input" && (
          <ProductForm
            categories={data.categories}
            onSubmit={handleSubmitProduct}
            onUpdateCategories={handleUpdateCategories}
          />
        )}

        {activeTab === "plans" && (
          <MonthlyPlans
            plans={data.splitPlans}
            productsById={productsById}
            settingsByProductId={settingsByProductId}
            onToggleStatus={handleTogglePlanStatus}
            onToggleRemainderStatus={handleToggleRemainderStatus}
          />
        )}

        {activeTab === "products" && (
          <ProductList
            products={data.productEntries}
            splitSettings={data.splitSettings}
            splitPlans={data.splitPlans}
            categories={data.categories}
            onUpdateCategories={handleUpdateCategories}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === "data" && (
          <DataManagement
            data={data}
            onImportData={handleImportData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
