import type { PlanStatus, ProductEntry, SplitPlan } from "../types";
import { formatMoney } from "../utils/money";

type PlanCardProps = {
  plan: SplitPlan;
  product?: ProductEntry;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
};

export function PlanCard({ plan, product, onToggleStatus }: PlanCardProps) {
  return (
    <article className="item-card">
      <div className="item-card-main">
        <div>
          <p className="item-title">{product?.officialItemName ?? "削除済みの商品"}</p>
          <p className="item-subtitle">{product?.category ?? "分類なし"}</p>
        </div>
        <strong>{formatMoney(plan.allocatedAmount)}</strong>
      </div>
      {plan.memo && <p className="memo">{plan.memo}</p>}
      <div className="status-row">
        <span className={plan.status === "done" ? "status done" : "status pending"}>
          {plan.status === "done" ? "入力済み" : "未入力"}
        </span>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onToggleStatus(plan.id, plan.status === "done" ? "pending" : "done")}
        >
          {plan.status === "done" ? "未入力に戻す" : "入力済みにする"}
        </button>
      </div>
    </article>
  );
}
