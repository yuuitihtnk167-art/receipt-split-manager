import { useMemo, useState } from "react";
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
};

type ReceiptReaderProps = {
  learningCandidates: LearningCandidate[];
  onRegisterItems: (items: ProductFormValues[]) => void;
};

export function ReceiptReader({ learningCandidates, onRegisterItems }: ReceiptReaderProps) {
  const [purchaseDate, setPurchaseDate] = useState(getTodayDate());
  const [storeName, setStoreName] = useState("");
  const [text, setText] = useState("");
  const [candidates, setCandidates] = useState<ReceiptCandidate[]>([]);
  const [message, setMessage] = useState("");
  const selectedCandidates = useMemo(
    () =>
      candidates.filter(
        (candidate) =>
          candidate.selected &&
          candidate.officialItemName.trim() &&
          parseMoney(candidate.amountWithTax) > 0,
      ),
    [candidates],
  );

  function handleParse(): void {
    const nextCandidates = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => parseReceiptLine(line, learningCandidates));

    setCandidates(nextCandidates);
    setMessage(`${nextCandidates.length}件の候補を作成しました。`);
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
        inputMethod: "normal",
        splitMonths: "2",
        splitStartMonth: purchaseDate.slice(0, 7),
        splitMemo: "",
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

        <label className="field">
          <span>OCR結果の貼り付け</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={"例：\nコーヒー豆 980\n牛乳 248\n洗剤 398"}
          />
        </label>

        <button type="button" className="primary-button" onClick={handleParse}>
          1行ごとに分解
        </button>
      </div>

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
        カメラ撮影やOCR本体はまだ実装していません。将来のOCR結果を想定して、テキストを貼り付けて確認できます。
      </p>
    </section>
  );
}

function parseReceiptLine(
  line: string,
  learningCandidates: LearningCandidate[],
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
