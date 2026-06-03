import type { LearningCandidate } from "../types";
import { formatDate } from "../utils/date";
import { formatMoney } from "../utils/money";

type LearningDictionaryProps = {
  candidates: LearningCandidate[];
  onDelete: (candidateId: string) => void;
};

export function LearningDictionary({ candidates, onDelete }: LearningDictionaryProps) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">学習辞書</p>
        <h2>候補表示の土台</h2>
      </div>

      {candidates.length === 0 ? (
        <p className="empty-message">商品を登録すると、候補がここに保存されます。</p>
      ) : (
        <div className="card-list">
          {candidates.map((candidate) => (
            <article key={candidate.id} className="item-card">
              <div className="item-card-main">
                <div>
                  <p className="item-title">{candidate.receiptItemName}</p>
                  <p className="item-subtitle">
                    候補：{candidate.officialItemName} / {candidate.category}
                  </p>
                </div>
                <strong>{candidate.confirmedCount}回</strong>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>店舗名</dt>
                  <dd>{candidate.storeName || "未設定"}</dd>
                </div>
                <div>
                  <dt>金額帯</dt>
                  <dd>
                    {formatMoney(candidate.priceMin)} - {formatMoney(candidate.priceMax)}
                  </dd>
                </div>
                <div>
                  <dt>最終使用日</dt>
                  <dd>{formatDate(candidate.lastUsedDate)}</dd>
                </div>
              </dl>
              <button
                type="button"
                className="danger-button"
                onClick={() => onDelete(candidate.id)}
              >
                削除
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
