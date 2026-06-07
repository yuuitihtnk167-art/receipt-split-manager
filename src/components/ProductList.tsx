import { FormEvent, useState } from "react";
import type { CategoryGroup, ProductEntry, ProductFormValues, SplitPlan, SplitSetting } from "../types";
import { formatCategory, getFallbackCategory } from "../categories";
import { addMonths, formatDate, formatMonth } from "../utils/date";
import { formatMoney, parseMoney } from "../utils/money";
import { CategoryPicker } from "./CategoryPicker";

type ProductListProps = {
  products: ProductEntry[];
  splitSettings: SplitSetting[];
  splitPlans: SplitPlan[];
  categories: CategoryGroup[];
  onUpdateCategories: (categories: CategoryGroup[]) => void;
  onUpdateProduct: (productId: string, values: ProductFormValues) => void;
  onDeleteProduct: (productId: string) => void;
  notice?: string;
};

export function ProductList({
  products,
  splitSettings,
  splitPlans,
  categories,
  onUpdateCategories,
  onUpdateProduct,
  onDeleteProduct,
  notice,
}: ProductListProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ProductFormValues | null>(null);
  const [editError, setEditError] = useState("");
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const settingsByProductId = new Map(
    splitSettings.map((setting) => [setting.productEntryId, setting]),
  );
  const fallbackCategory = getFallbackCategory(categories);

  function handleDeleteClick(product: ProductEntry): void {
    const confirmed = window.confirm(
      `${product.officialItemName}を削除します。\n紐づく分割入力予定も一緒に削除されます。よろしいですか？`,
    );

    if (confirmed) {
      onDeleteProduct(product.id);
    }
  }

  function startEditing(product: ProductEntry, setting: SplitSetting | undefined): void {
    const categoryValues = resolveProductCategory(product, categories, fallbackCategory);

    setEditingProductId(product.id);
    setEditValues({
      purchaseDate: product.purchaseDate,
      storeName: product.storeName,
      receiptItemName: product.receiptItemName,
      officialItemName: product.officialItemName,
      amountWithTax: String(product.amountWithTax),
      category: formatCategory(categoryValues.major, categoryValues.minor),
      categoryMajor: categoryValues.major,
      categoryMinor: categoryValues.minor,
      inputMethod: "split",
      splitMonths: setting ? String(setting.months) : "6",
      splitStartMonth: setting?.startMonth ?? product.purchaseDate.slice(0, 7),
      splitMemo: product.memo ?? setting?.memo ?? "",
    });
    setEditError("");
  }

  function cancelEditing(): void {
    setEditingProductId(null);
    setEditValues(null);
    setEditError("");
  }

  function updateEditValue(name: keyof ProductFormValues, value: string): void {
    setEditValues((current) => (current ? { ...current, [name]: value } : current));
  }

  function selectEditCategory(major: string, minor: string): void {
    setEditValues((current) =>
      current
        ? {
            ...current,
            category: formatCategory(major, minor),
            categoryMajor: major,
            categoryMinor: minor,
          }
        : current,
    );
    setIsCategoryPickerOpen(false);
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>, product: ProductEntry): void {
    event.preventDefault();

    if (!editValues) {
      return;
    }

    const amount = parseMoney(editValues.amountWithTax);
    const splitMonths = Number(editValues.splitMonths);

    setEditError("");

    if (
      !editValues.purchaseDate ||
      !editValues.receiptItemName.trim()
    ) {
      setEditError("日付と内容を入力してください。");
      return;
    }

    if (!editValues.storeName.trim()) {
      setEditError("支出元を入力してください。");
      return;
    }

    if (amount <= 0) {
      setEditError("金額は1円以上で入力してください。");
      return;
    }

    if (!editValues.categoryMajor || !editValues.categoryMinor) {
      setEditError("カテゴリを選択してください。");
      return;
    }

    if (!Number.isInteger(splitMonths) || splitMonths < 2) {
      setEditError("分割月数は2ヶ月以上で入力してください。");
      return;
    }

    if (!editValues.splitStartMonth) {
      setEditError("開始月を入力してください。");
      return;
    }

    const confirmed = window.confirm(
      "分割予定を再計算します。入力済みの月は入力済みのまま保持します。よろしいですか？",
    );

    if (!confirmed) {
      return;
    }

    onUpdateProduct(product.id, {
      ...editValues,
      officialItemName: editValues.receiptItemName.trim(),
      category: formatCategory(editValues.categoryMajor, editValues.categoryMinor),
      inputMethod: "split",
    });
    cancelEditing();
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">登録済み商品一覧</p>
        <h2>実支出の記録</h2>
      </div>

      {notice && <p className="info-message">{notice}</p>}

      {products.length === 0 ? (
        <p className="empty-message">登録済みの商品はありません。</p>
      ) : (
        <div className="card-list">
          {products.map((product) => {
            const setting = settingsByProductId.get(product.id);
            const productPlans = splitPlans.filter((plan) => plan.productEntryId === product.id);
            const doneCount = productPlans.filter((plan) => plan.status === "done").length;
            const isEditing = editingProductId === product.id && editValues !== null;
            const editAmount = editValues ? parseMoney(editValues.amountWithTax) : 0;
            const editMonths = editValues ? Number(editValues.splitMonths) : 0;
            const editMonthlyAmount =
              Number.isInteger(editMonths) && editMonths > 0
                ? Math.floor(editAmount / editMonths)
                : 0;
            const editRemainder =
              Number.isInteger(editMonths) && editMonths > 0
                ? editAmount - editMonthlyAmount * editMonths
                : 0;
            return (
              <article key={product.id} className="item-card">
                <div className="item-card-main">
                  <div>
                    <p className="item-title">{product.officialItemName}</p>
                    <p className="item-subtitle">
                      {product.storeName || "支出元なし"} / {formatProductCategory(product)}
                    </p>
                  </div>
                  <strong>{formatMoney(product.amountWithTax)}</strong>
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>日付</dt>
                    <dd>{formatDate(product.purchaseDate)}</dd>
                  </div>
                  <div>
                    <dt>内容</dt>
                    <dd>{product.receiptItemName}</dd>
                  </div>
                  {setting && (
                    <div>
                      <dt>配分</dt>
                      <dd>
                        {formatMonth(setting.startMonth)}〜
                        {formatMonth(addMonths(setting.startMonth, setting.months - 1))}
                        （{setting.months}か月）
                      </dd>
                    </div>
                  )}
                  {!setting && (
                    <div>
                      <dt>分割予定</dt>
                      <dd>未設定。編集保存すると分割予定を作成します。</dd>
                    </div>
                  )}
                  {product.memo && (
                    <div>
                      <dt>メモ</dt>
                      <dd>{product.memo}</dd>
                    </div>
                  )}
                  {productPlans.length > 0 && (
                    <div>
                      <dt>入力状況</dt>
                      <dd>
                        {doneCount}/{productPlans.length}件 入力済み
                      </dd>
                    </div>
                  )}
                </dl>
                {isEditing && (
                  <form className="edit-form" onSubmit={(event) => handleEditSubmit(event, product)}>
                    <label className="field">
                      <span>金額（税込）</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValues.amountWithTax}
                        onChange={(event) => updateEditValue("amountWithTax", event.target.value)}
                      />
                    </label>
                    <div className="field">
                      <span>カテゴリ</span>
                      <button
                        type="button"
                        className="selection-button"
                        onClick={() => setIsCategoryPickerOpen(true)}
                      >
                        <span>
                          {formatCategory(
                            editValues.categoryMajor,
                            editValues.categoryMinor,
                          )}
                        </span>
                        <span aria-hidden="true">›</span>
                      </button>
                    </div>
                    <label className="field">
                      <span>日付</span>
                      <input
                        type="date"
                        value={editValues.purchaseDate}
                        onChange={(event) => updateEditValue("purchaseDate", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>内容</span>
                      <input
                        type="text"
                        value={editValues.receiptItemName}
                        onChange={(event) => updateEditValue("receiptItemName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>支出元</span>
                      <input
                        type="text"
                        value={editValues.storeName}
                        onChange={(event) => updateEditValue("storeName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>メモ</span>
                      <textarea
                        value={editValues.splitMemo}
                        onChange={(event) => updateEditValue("splitMemo", event.target.value)}
                      />
                    </label>
                    <div className="split-panel">
                      <label className="field">
                        <span>分割月数</span>
                        <input
                          type="number"
                          min="2"
                          step="1"
                          value={editValues.splitMonths}
                          onChange={(event) => updateEditValue("splitMonths", event.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>開始月</span>
                        <input
                          type="month"
                          value={editValues.splitStartMonth}
                          onChange={(event) =>
                            updateEditValue("splitStartMonth", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className="allocation-preview">
                      <div>
                        <span>分割後の金額（1ヶ月あたり）</span>
                        <strong>{formatMoney(editMonthlyAmount)}</strong>
                      </div>
                      <div>
                        <span>端数</span>
                        <strong>{formatMoney(editRemainder)}</strong>
                      </div>
                      <small>端数は最初の入力に加算します。</small>
                    </div>
                    {editError && <p className="error-message">{editError}</p>}
                    <div className="inline-actions">
                      <button type="submit" className="primary-button">
                        保存
                      </button>
                      <button type="button" className="secondary-button" onClick={cancelEditing}>
                        キャンセル
                      </button>
                    </div>
                  </form>
                )}
                <div className="inline-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => startEditing(product, setting)}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleDeleteClick(product)}
                  >
                    削除
                  </button>
                </div>
                {isEditing && isCategoryPickerOpen && (
                  <CategoryPicker
                    categories={categories}
                    selectedMajor=""
                    onClose={() => setIsCategoryPickerOpen(false)}
                    onSelect={selectEditCategory}
                    onUpdateCategories={onUpdateCategories}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function resolveProductCategory(
  product: ProductEntry,
  categories: CategoryGroup[],
  fallbackCategory: { major: string; minor: string },
): { major: string; minor: string } {
  const matchedGroup = categories.find((category) => category.name === product.categoryMajor);
  const matchedSubcategory = matchedGroup?.subcategories.find(
    (subcategory) => subcategory.name === product.categoryMinor,
  );

  if (matchedGroup && matchedSubcategory) {
    return {
      major: matchedGroup.name,
      minor: matchedSubcategory.name,
    };
  }

  return fallbackCategory;
}

function formatProductCategory(product: ProductEntry): string {
  if (product.categoryMajor && product.categoryMinor) {
    return formatCategory(product.categoryMajor, product.categoryMinor);
  }

  return product.category || "未分類";
}
