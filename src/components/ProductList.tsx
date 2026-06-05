import { FormEvent, useState } from "react";
import type { ProductEntry, ProductFormValues, SplitPlan, SplitSetting } from "../types";
import { formatDate, formatMonth } from "../utils/date";
import { formatMoney, parseMoney } from "../utils/money";

type ProductListProps = {
  products: ProductEntry[];
  splitSettings: SplitSetting[];
  splitPlans: SplitPlan[];
  onUpdateProduct: (productId: string, values: ProductFormValues) => void;
  onDeleteProduct: (productId: string) => void;
  notice?: string;
};

export function ProductList({
  products,
  splitSettings,
  splitPlans,
  onUpdateProduct,
  onDeleteProduct,
  notice,
}: ProductListProps) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<ProductFormValues | null>(null);
  const [editError, setEditError] = useState("");
  const settingsByProductId = new Map(
    splitSettings.map((setting) => [setting.productEntryId, setting]),
  );

  function handleDeleteClick(product: ProductEntry): void {
    const confirmed = window.confirm(
      `${product.officialItemName}を削除します。\n紐づく分割入力予定も一緒に削除されます。よろしいですか？`,
    );

    if (confirmed) {
      onDeleteProduct(product.id);
    }
  }

  function startEditing(product: ProductEntry, setting: SplitSetting | undefined): void {
    setEditingProductId(product.id);
    setEditValues({
      purchaseDate: product.purchaseDate,
      storeName: product.storeName,
      receiptItemName: product.receiptItemName,
      officialItemName: product.officialItemName,
      amountWithTax: String(product.amountWithTax),
      category: product.category,
      inputMethod: product.inputMethod,
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
      !editValues.receiptItemName.trim() ||
      !editValues.officialItemName.trim()
    ) {
      setEditError("購入日、商品名、正式な商品名を入力してください。");
      return;
    }

    if (amount <= 0) {
      setEditError("金額は1円以上で入力してください。");
      return;
    }

    if (!editValues.category.trim()) {
      setEditError("分類を入力してください。");
      return;
    }

    if (editValues.inputMethod === "split") {
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
    }

    onUpdateProduct(product.id, editValues);
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

            return (
              <article key={product.id} className="item-card">
                <div className="item-card-main">
                  <div>
                    <p className="item-title">{product.officialItemName}</p>
                    <p className="item-subtitle">
                      {product.storeName || "店舗名なし"} / {product.category}
                    </p>
                  </div>
                  <strong>{formatMoney(product.amountWithTax)}</strong>
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>購入日</dt>
                    <dd>{formatDate(product.purchaseDate)}</dd>
                  </div>
                  <div>
                    <dt>入力方法</dt>
                    <dd>{product.inputMethod === "split" ? "分割入力" : "通常入力"}</dd>
                  </div>
                  <div>
                    <dt>商品名</dt>
                    <dd>{product.receiptItemName}</dd>
                  </div>
                  {setting && (
                    <div>
                      <dt>配分</dt>
                      <dd>
                        {formatMonth(setting.startMonth)}から{setting.months}ヶ月
                      </dd>
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
                      <span>購入日</span>
                      <input
                        type="date"
                        value={editValues.purchaseDate}
                        onChange={(event) => updateEditValue("purchaseDate", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>店舗名</span>
                      <input
                        type="text"
                        value={editValues.storeName}
                        onChange={(event) => updateEditValue("storeName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>商品名</span>
                      <input
                        type="text"
                        value={editValues.receiptItemName}
                        onChange={(event) => updateEditValue("receiptItemName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>正式な商品名</span>
                      <input
                        type="text"
                        value={editValues.officialItemName}
                        onChange={(event) => updateEditValue("officialItemName", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>金額（税込）</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editValues.amountWithTax}
                        onChange={(event) => updateEditValue("amountWithTax", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>分類</span>
                      <input
                        type="text"
                        value={editValues.category}
                        onChange={(event) => updateEditValue("category", event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>メモ</span>
                      <textarea
                        value={editValues.splitMemo}
                        onChange={(event) => updateEditValue("splitMemo", event.target.value)}
                      />
                    </label>
                    <fieldset className="choice-group">
                      <legend>入力方法</legend>
                      <label>
                        <input
                          type="radio"
                          name={`edit-input-method-${product.id}`}
                          checked={editValues.inputMethod === "normal"}
                          onChange={() => updateEditValue("inputMethod", "normal")}
                        />
                        通常入力
                      </label>
                      <label>
                        <input
                          type="radio"
                          name={`edit-input-method-${product.id}`}
                          checked={editValues.inputMethod === "split"}
                          onChange={() => updateEditValue("inputMethod", "split")}
                        />
                        分割入力
                      </label>
                    </fieldset>
                    {editValues.inputMethod === "split" && (
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
                    )}
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
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
