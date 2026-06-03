import type { PlanStatus, ProductEntry, SplitPlan } from "../types";
import { getCurrentMonth, formatMonth } from "../utils/date";
import { formatMoney } from "../utils/money";
import { PlanCard } from "./PlanCard";

type MonthlySummaryProps = {
  plans: SplitPlan[];
  productsById: Map<string, ProductEntry>;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
};

export function MonthlySummary({
  plans,
  productsById,
  onToggleStatus,
}: MonthlySummaryProps) {
  const currentMonth = getCurrentMonth();
  const monthPlans = plans.filter((plan) => plan.targetMonth === currentMonth);
  const total = monthPlans.reduce((sum, plan) => sum + plan.allocatedAmount, 0);
  const pendingTotal = monthPlans
    .filter((plan) => plan.status === "pending")
    .reduce((sum, plan) => sum + plan.allocatedAmount, 0);

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">今月の入力予定</p>
        <h2>{formatMonth(currentMonth)}の入力予定</h2>
      </div>

      <div className="summary-strip">
        <div>
          <span>未入力合計</span>
          <strong>{formatMoney(pendingTotal)}</strong>
        </div>
        <div>
          <span>予定合計</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>

      {monthPlans.length === 0 ? (
        <p className="empty-message">今月の分割入力予定はありません。</p>
      ) : (
        <div className="card-list">
          {monthPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              product={productsById.get(plan.productEntryId)}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </section>
  );
}
