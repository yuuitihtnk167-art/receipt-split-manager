import { FormEvent, useMemo, useState } from "react";
import type { CategoryGroup, ProductFormValues } from "../types";
import { formatCategory, getFallbackCategory } from "../categories";
import { getCurrentMonth, getTodayDate } from "../utils/date";
import { formatMoney, parseMoney } from "../utils/money";
import { CategoryPicker } from "./CategoryPicker";

const defaultValues: ProductFormValues = {
  purchaseDate: getTodayDate(),
  storeName: "",
  receiptItemName: "",
  officialItemName: "",
  amountWithTax: "",
  category: "",
  categoryMajor: "未分類",
  categoryMinor: "未分類",
  inputMethod: "split",
  splitMonths: "6",
  splitStartMonth: getCurrentMonth(),
  splitMemo: "",
};

type ProductFormProps = {
  categories: CategoryGroup[];
  onSubmit: (values: ProductFormValues) => void;
  onUpdateCategories: (categories: CategoryGroup[]) => void;
};

export function ProductForm({
  categories,
  onSubmit,
  onUpdateCategories,
}: ProductFormProps) {
  const fallbackCategory = useMemo(() => getFallbackCategory(categories), [categories]);
  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...defaultValues,
    category: formatCategory(fallbackCategory.major, fallbackCategory.minor),
    categoryMajor: fallbackCategory.major,
    categoryMinor: fallbackCategory.minor,
  }));
  const [error, setError] = useState("");
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const amount = parseMoney(values.amountWithTax);
  const splitMonths = Number(values.splitMonths);
  const monthlyPreview =
    Number.isInteger(splitMonths) && splitMonths > 0
      ? Math.floor(amount / splitMonths)
      : 0;
  const remainder =
    Number.isInteger(splitMonths) && splitMonths > 0
      ? amount - monthlyPreview * splitMonths
      : 0;

  function updateValue(name: keyof ProductFormValues, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function selectCategory(major: string, minor: string): void {
    setValues((current) => ({
      ...current,
      category: formatCategory(major, minor),
      categoryMajor: major,
      categoryMinor: minor,
    }));
    setIsCategoryPickerOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");

    if (!values.purchaseDate || !values.receiptItemName.trim()) {
      setError("日付と内容を入力してください。");
      return;
    }

    if (!values.storeName.trim()) {
      setError("支出元を入力してください。");
      return;
    }

    if (amount <= 0) {
      setError("金額は1円以上で入力してください。");
      return;
    }

    if (!values.categoryMajor || !values.categoryMinor) {
      setError("カテゴリを選択してください。");
      return;
    }

    if (!Number.isInteger(splitMonths) || splitMonths < 2) {
      setError("分割月数は2ヶ月以上で入力してください。");
      return;
    }

    if (!values.splitStartMonth) {
      setError("開始月を入力してください。");
      return;
    }

    onSubmit({
      ...values,
      officialItemName: values.receiptItemName.trim(),
      category: formatCategory(values.categoryMajor, values.categoryMinor),
      inputMethod: "split",
    });
    setValues({
      ...defaultValues,
      purchaseDate: values.purchaseDate,
      storeName: values.storeName,
      category: formatCategory(fallbackCategory.major, fallbackCategory.minor),
      categoryMajor: fallbackCategory.major,
      categoryMinor: fallbackCategory.minor,
      splitStartMonth: getCurrentMonth(),
    });
  }

  return (
    <section className="screen entry-screen">
      <div className="screen-heading">
        <p className="eyebrow">支出入力</p>
        <h2>分割入力予定を登録</h2>
      </div>

      <form className="form-stack entry-form" onSubmit={handleSubmit}>
        <label className="field amount-field">
          <span>金額（税込）</span>
          <div className="money-input">
            <span>￥</span>
            <input
              type="text"
              inputMode="numeric"
              value={values.amountWithTax}
              onChange={(event) => updateValue("amountWithTax", event.target.value)}
              placeholder="50,000"
            />
          </div>
        </label>

        <div className="field">
          <span>カテゴリ</span>
          <button
            type="button"
            className="selection-button"
            onClick={() => setIsCategoryPickerOpen(true)}
          >
            <span>{formatCategory(values.categoryMajor, values.categoryMinor)}</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <label className="field">
          <span>日付</span>
          <input
            type="date"
            value={values.purchaseDate}
            onChange={(event) => updateValue("purchaseDate", event.target.value)}
          />
        </label>

        <label className="field">
          <span>内容</span>
          <input
            type="text"
            value={values.receiptItemName}
            onChange={(event) => updateValue("receiptItemName", event.target.value)}
            placeholder="例：ノートパソコン"
          />
        </label>

        <label className="field">
          <span>支出元</span>
          <input
            type="text"
            value={values.storeName}
            onChange={(event) => updateValue("storeName", event.target.value)}
            placeholder="例：家電ショップ"
          />
        </label>

        <label className="field">
          <span>メモ</span>
          <textarea
            value={values.splitMemo}
            onChange={(event) => updateValue("splitMemo", event.target.value)}
            placeholder="例：生活コスト配分として入力"
          />
        </label>

        <section className="split-panel">
          <div className="split-panel-title">
            <strong>分割設定</strong>
            <span>必須</span>
          </div>

          <div className="split-input-grid">
            <label className="field">
              <span>分割月数</span>
              <input
                type="number"
                min="2"
                step="1"
                value={values.splitMonths}
                onChange={(event) => updateValue("splitMonths", event.target.value)}
              />
            </label>

            <label className="field">
              <span>開始月</span>
              <input
                type="month"
                value={values.splitStartMonth}
                onChange={(event) => updateValue("splitStartMonth", event.target.value)}
              />
            </label>
          </div>
        </section>

        <div className="allocation-preview">
          <div>
            <span>分割後の金額（1ヶ月あたり）</span>
            <strong>{formatMoney(monthlyPreview)}</strong>
          </div>
          <div>
            <span>端数</span>
            <strong>{formatMoney(remainder)}</strong>
          </div>
          <small>端数は最終月の入力額に加算します。</small>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="primary-button submit-button">
          分割予定を登録
        </button>
      </form>

      {isCategoryPickerOpen && (
        <CategoryPicker
          categories={categories}
          selectedMajor=""
          onClose={() => setIsCategoryPickerOpen(false)}
          onSelect={selectCategory}
          onUpdateCategories={onUpdateCategories}
        />
      )}
    </section>
  );
}
