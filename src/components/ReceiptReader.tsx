import type { ChangeEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import type { LearningCandidate, ProductFormValues } from "../types";
import { getTodayDate } from "../utils/date";
import { parseMoney } from "../utils/money";

type ReceiptCandidate = {
  id: string;
  selected: boolean;
  rawLine: string;
  officialItemName: string;
  amountWithTax: string;
  category: string;
  completedFromDictionary: boolean;
  inputMethod: "normal" | "split";
  splitMonths: string;
  splitStartMonth: string;
  splitMemo: string;
};

type ReceiptReaderProps = {
  learningCandidates: LearningCandidate[];
  onRegisterItems: (items: ProductFormValues[]) => void;
};

type ReceiptImagePreview = {
  id: string;
  name: string;
  url: string;
};

export function ReceiptReader({ learningCandidates, onRegisterItems }: ReceiptReaderProps) {
  const [purchaseDate, setPurchaseDate] = useState(getTodayDate());
  const [storeName, setStoreName] = useState("");
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<ReceiptCandidate[]>([]);
  const [message, setMessage] = useState("");
  const [isReadingImages, setIsReadingImages] = useState(false);
  const [ocrProgress, setOcrProgress] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ReceiptImagePreview[]>([]);
  const [expandedImage, setExpandedImage] = useState<ReceiptImagePreview | null>(null);
  const selectedCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.selected &&
          candidate.officialItemName.trim() &&
          parseMoney(candidate.amountWithTax) > 0 &&
          (candidate.inputMethod === "normal" ||
            (Number(candidate.splitMonths) >= 2 && candidate.splitStartMonth)),
      ),
    [candidates],
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [imagePreviews]);

  function handleParse(): void {
    const nextCandidates = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseReceiptLine(line, learningCandidates, purchaseDate.slice(0, 7)));

    setCandidates(nextCandidates);
    setMessage(`${nextCandidates.length}件の候補を作成しました。`);
  }

  async function handleImageInput(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setIsReadingImages(true);
    setCandidates([]);
    setMessage("");
    setExpandedImage(null);
    setImagePreviews(
      selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name || "レシート画像",
        url: URL.createObjectURL(file),
      })),
    );

    try {
      const imageTexts: string[] = [];

      for (const [index, file] of selectedFiles.entries()) {
        setOcrProgress(`${index + 1}/${selectedFiles.length}枚目を読み取り中`);
        const result = await Tesseract.recognize(file, "jpn+eng");
        const recognizedText = result.data.text.trim();

        if (recognizedText) {
          imageTexts.push(recognizedText);
        }
      }

      setText(imageTexts.join("\n"));
      setMessage(
        `${selectedFiles.length}枚の画像を読み取りました。必要に応じて手修正してから分解してください。`,
      );
    } catch (error) {
      console.error(error);
      setMessage("OCR読み取りに失敗しました。画像を確認して、もう一度試してください。");
    } finally {
      setIsReadingImages(false);
      setOcrProgress("");
    }
  }

  function addManualCandidate(): void {
    setCandidates((currentCandidates) => [
      ...currentCandidates,
      createManualCandidate(purchaseDate.slice(0, 7)),
    ]);
    setMessage("画像を見ながら入力できる候補を追加しました。");
  }

  function updateCandidate(
    candidateId: string,
    key: keyof ReceiptCandidate,
    value: string | boolean,
  ): void {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, [key]: value } : candidate,
      ),
    );
  }

  function handleRegisterSelected(): void {
    if (selectedCandidates.length === 0) {
      setMessage("登録できる候補がありません。正式商品名と金額を確認してください。");
      return;
    }

    onRegisterItems(
      selectedCandidates.map((candidate) => ({
        purchaseDate,
        storeName,
        receiptItemName: candidate.rawLine,
        officialItemName: candidate.officialItemName,
        amountWithTax: candidate.amountWithTax,
        category: candidate.category,
        inputMethod: candidate.inputMethod,
        splitMonths: candidate.splitMonths,
        splitStartMonth: candidate.splitStartMonth,
        splitMemo: candidate.splitMemo,
      })),
    );
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">レシート読取</p>
        <h2>読み取り結果の確認</h2>
      </div>

      <div className="form-stack">
        <label className="field">
          <span>購入日</span>
          <input
            type="date"
            value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)}
          />
        </label>

        <label className="field">
          <span>店舗名</span>
          <input
            type="text"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="例：スーパー"
          />
        </label>

        <div className="field">
          <span>画像から読み取り</span>
          <div className="image-actions">
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              カメラで撮影
              <input
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              画像を選択
              <input
                type="file"
                accept="image/*"
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
            <label className={`file-button${isReadingImages ? " disabled" : ""}`}>
              複数画像を選択
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={isReadingImages}
                onChange={handleImageInput}
              />
            </label>
          </div>
        </div>

        {imagePreviews.length > 0 && (
          <div className="receipt-preview-panel">
            <div className="receipt-preview-heading">
              <div>
                <span>レシート画像</span>
                <p>画像はこの画面での確認用です。localStorageには保存しません。</p>
              </div>
              <button type="button" className="secondary-button" onClick={addManualCandidate}>
                手入力候補を追加
              </button>
            </div>
            <div className="receipt-preview-list">
              {imagePreviews.map((preview, index) => (
                <article key={preview.id} className="receipt-preview-card">
                  <button
                    type="button"
                    className="receipt-preview-button"
                    onClick={() => setExpandedImage(preview)}
                  >
                    <img src={preview.url} alt={`${index + 1}枚目のレシート画像`} />
                  </button>
                  <div className="receipt-preview-meta">
                    <strong>{index + 1}枚目</strong>
                    <span>{preview.name}</span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setExpandedImage(preview)}
                    >
                      拡大表示
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>OCR結果の貼り付け・修正</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={"例：\nコーヒー豆 980\n牛乳 248\n洗剤 398"}
          />
        </label>

        <button
          type="button"
          className="primary-button"
          onClick={handleParse}
          disabled={isReadingImages}
        >
          1行ごとに分解
        </button>

        <button type="button" className="secondary-button" onClick={addManualCandidate}>
          画像を見ながら手入力候補を追加
        </button>
      </div>

      {isReadingImages && <p className="info-message">{ocrProgress || "読み取り中"}</p>}
      {message && <p className="info-message">{message}</p>}

      {candidates.length > 0 && (
        <div className="card-list">
          {candidates.map((candidate, index) => (
            <article key={candidate.id} className="item-card">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={candidate.selected}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "selected", event.target.checked)
                  }
                />
                <span>候補 {index + 1}</span>
              </label>
              <p className="item-subtitle">{candidate.rawLine}</p>
              {candidate.completedFromDictionary && (
                <p className="dictionary-match">学習辞書から補完</p>
              )}
              <label className="field">
                <span>レシート上の商品名</span>
                <input
                  type="text"
                  value={candidate.rawLine}
                  onChange={(event) => updateCandidate(candidate.id, "rawLine", event.target.value)}
                />
              </label>
              <label className="field">
                <span>正式商品名</span>
                <input
                  type="text"
                  value={candidate.officialItemName}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "officialItemName", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>金額（税込）</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={candidate.amountWithTax}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "amountWithTax", event.target.value)
                  }
                />
              </label>
              <label className="field">
                <span>分類</span>
                <input
                  type="text"
                  value={candidate.category}
                  onChange={(event) =>
                    updateCandidate(candidate.id, "category", event.target.value)
                  }
                  placeholder="例：食費"
                />
              </label>
              <fieldset className="choice-group">
                <legend>入力方法</legend>
                <label>
                  <input
                    type="radio"
                    name={`receipt-input-method-${candidate.id}`}
                    checked={candidate.inputMethod === "normal"}
                    onChange={() => updateCandidate(candidate.id, "inputMethod", "normal")}
                  />
                  通常入力
                </label>
                <label>
                  <input
                    type="radio"
                    name={`receipt-input-method-${candidate.id}`}
                    checked={candidate.inputMethod === "split"}
                    onChange={() => updateCandidate(candidate.id, "inputMethod", "split")}
                  />
                  分割入力
                </label>
              </fieldset>
              {candidate.inputMethod === "split" && (
                <div className="split-panel">
                  <label className="field">
                    <span>分割月数</span>
                    <input
                      type="number"
                      min="2"
                      step="1"
                      value={candidate.splitMonths}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitMonths", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>開始月</span>
                    <input
                      type="month"
                      value={candidate.splitStartMonth}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitStartMonth", event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>メモ</span>
                    <textarea
                      value={candidate.splitMemo}
                      onChange={(event) =>
                        updateCandidate(candidate.id, "splitMemo", event.target.value)
                      }
                      placeholder="例：生活コスト配分として入力"
                    />
                  </label>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {candidates.length > 0 && (
        <button type="button" className="primary-button" onClick={handleRegisterSelected}>
          選択した項目を商品登録へ反映
        </button>
      )}

      <p className="empty-message">
        画像の自動合成、重複行の自動削除、独自カメラUIはまだ実装していません。読み取り結果は手修正できます。
      </p>

      {expandedImage && (
        <div className="image-modal" role="dialog" aria-modal="true">
          <div className="image-modal-header">
            <strong>{expandedImage.name}</strong>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setExpandedImage(null)}
            >
              閉じる
            </button>
          </div>
          <div className="image-modal-body">
            <img src={expandedImage.url} alt="拡大表示したレシート画像" />
          </div>
        </div>
      )}
    </section>
  );
}

function parseReceiptLine(
  line: string,
  learningCandidates: LearningCandidate[],
  defaultStartMonth: string,
): ReceiptCandidate {
  const amountMatch = line.match(/([0-9０-９][0-9０-９,，]*)\s*円?\s*$/);
  const amountText = amountMatch ? normalizeNumber(amountMatch[1]) : "";
  const itemName = amountMatch ? line.slice(0, amountMatch.index).trim() : line;
  const dictionaryMatch = findDictionaryMatch(itemName || line, learningCandidates);

  return {
    id: crypto.randomUUID(),
    selected: true,
    rawLine: line,
    officialItemName: dictionaryMatch?.officialItemName ?? itemName ?? line,
    amountWithTax: amountText,
    category: dictionaryMatch?.category ?? "",
    completedFromDictionary: Boolean(dictionaryMatch),
    inputMethod: "normal",
    splitMonths: "2",
    splitStartMonth: defaultStartMonth,
    splitMemo: "",
  };
}

function createManualCandidate(defaultStartMonth: string): ReceiptCandidate {
  return {
    id: crypto.randomUUID(),
    selected: true,
    rawLine: "",
    officialItemName: "",
    amountWithTax: "",
    category: "",
    completedFromDictionary: false,
    inputMethod: "normal",
    splitMonths: "2",
    splitStartMonth: defaultStartMonth,
    splitMemo: "",
  };
}

function findDictionaryMatch(
  receiptItemName: string,
  learningCandidates: LearningCandidate[],
): LearningCandidate | undefined {
  return learningCandidates
    .filter((candidate) => candidate.receiptItemName === receiptItemName)
    .sort((a, b) => b.confirmedCount - a.confirmedCount)[0];
}

function normalizeNumber(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[，,]/g, "");
}
