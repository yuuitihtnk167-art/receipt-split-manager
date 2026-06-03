import { FormEvent, useMemo, useState } from "react";
import type { LearningCandidate, ProductFormValues } from "../types";
import { getCurrentMonth, getTodayDate } from "../utils/date";
import { formatMoney, parseMoney } from "../utils/money";

const defaultValues: ProductFormValues = {
  purchaseDate: getTodayDate(),
  storeName: "",
  receiptItemName: "",
  officialItemName: "",
  amountWithTax: "",
  category: "",
  inputMethod: "normal",
  splitMonths: "6",
  splitStartMonth: getCurrentMonth(),
  splitMemo: "",
};

type ProductFormProps = {
  learningCandidates: LearningCandidate[];
  onSubmit: (values: ProductFormValues) => void;
};

export function ProductForm({ learningCandidates, onSubmit }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(defaultValues);
  const [error, setError] = useState("");
  const amount = parseMoney(values.amountWithTax);
  const splitMonths = Number(values.splitMonths);
  const monthlyPreview =
    values.inputMethod === "split" && splitMonths > 0
      ? Math.floor(amount / splitMonths)
      : 0;
  const lastMonthPreview =
    values.inputMethod === "split" && splitMonths > 0
      ? amount - monthlyPreview * (splitMonths - 1)
      : 0;
  const matchedCandidates = useMemo(() => {
    const receiptName = values.receiptItemName.trim();

    if (!receiptName) {
      return [];
    }

    return learningCandidates
      .filter((candidate) => candidate.receiptItemName === receiptName)
      .sort((a, b) => b.confirmedCount - a.confirmedCount)
      .slice(0, 3);
  }, [learningCandidates, values.receiptItemName]);

  function updateValue(name: keyof ProductFormValues, value: string): void {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function applyCandidate(candidate: LearningCandidate): void {
    setValues((current) => ({
      ...current,
      officialItemName: candidate.officialItemName,
      category: candidate.category,
      storeName: current.storeName || candidate.storeName,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError("");

    if (!values.purchaseDate || !values.receiptItemName.trim() || !values.officialItemName.trim()) {
      setError("購入日、レシート上の商品名、正式な商品名を入力してください。");
      return;
    }

    if (amount <= 0) {
      setError("金額は1円以上で入力してください。");
      return;
    }

    if (!values.category.trim()) {
      setError("分類を入力してください。");
      return;
    }

    if (values.inputMethod === "split") {
      if (!Number.isInteger(splitMonths) || splitMonths < 2) {
        setError("分割月数は2ヶ月以上で入力してください。");
        return;
      }

      if (!values.splitStartMonth) {
        setError("開始月を入力してください。");
        return;
      }
    }

    onSubmit(values);
    setValues({
      ...defaultValues,
      purchaseDate: values.purchaseDate,
      storeName: values.storeName,
      splitStartMonth: getCurrentMonth(),
    });
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">商品入力</p>
        <h2>レシート項目を登録</h2>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>購入日</span>
          <input
            type="date"
            value={values.purchaseDate}
            onChange={(event) => updateValue("purchaseDate", event.target.value)}
          />
        </label>

        <label className="field">
          <span>店舗名</span>
          <input
            type="text"
            value={values.storeName}
            onChange={(event) => updateValue("storeName", event.target.value)}
            placeholder="例：家電ショップ"
          />
        </label>

        <label className="field">
          <span>レシート上の商品名</span>
          <input
            type="text"
            value={values.receiptItemName}
            onChange={(event) => updateValue("receiptItemName", event.target.value)}
            placeholder="例：PC-ABC123"
          />
        </label>

        {matchedCandidates.length > 0 && (
          <div className="candidate-box">
            <p>過去の候補</p>
            {matchedCandidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                onClick={() => applyCandidate(candidate)}
              >
                {candidate.officialItemName} / {candidate.category}
              </button>
            ))}
          </div>
        )}

        <label className="field">
          <span>正式な商品名</span>
          <input
            type="text"
            value={values.officialItemName}
            onChange={(event) => updateValue("officialItemName", event.target.value)}
            placeholder="例：ノートパソコン"
          />
        </label>

        <label className="field">
          <span>金額（税込）</span>
          <input
            type="text"
            inputMode="numeric"
            value={values.amountWithTax}
            onChange={(event) => updateValue("amountWithTax", event.target.value)}
            placeholder="例：60000"
          />
        </label>

        <label className="field">
          <span>分類</span>
          <input
            type="text"
            value={values.category}
            onChange={(event) => updateValue("category", event.target.value)}
            placeholder="例：家電"
          />
        </label>

        <fieldset className="choice-group">
          <legend>入力方法</legend>
          <label>
            <input
              type="radio"
              name="inputMethod"
              checked={values.inputMethod === "normal"}
              onChange={() => updateValue("inputMethod", "normal")}
            />
            通常入力
          </label>
          <label>
            <input
              type="radio"
              name="inputMethod"
              checked={values.inputMethod === "split"}
              onChange={() => updateValue("inputMethod", "split")}
            />
            分割入力
          </label>
        </fieldset>

        {values.inputMethod === "split" && (
          <div className="split-panel">
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

            <label className="field">
              <span>メモ</span>
              <textarea
                value={values.splitMemo}
                onChange={(event) => updateValue("splitMemo", event.target.value)}
                placeholder="例：生活コスト配分として6ヶ月で入力"
              />
            </label>

            <div className="preview-box">
              <span>月額入力額の目安</span>
              <strong>
                {formatMoney(monthlyPreview)}
                {lastMonthPreview !== monthlyPreview && ` / 最終月 ${formatMoney(lastMonthPreview)}`}
              </strong>
              <small>端数は最終月で調整します。</small>
            </div>
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="primary-button">
          登録する
        </button>
      </form>
    </section>
  );
}
