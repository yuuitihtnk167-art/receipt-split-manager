import { useMemo, useState } from "react";
import type { PlanStatus, ProductEntry, SplitPlan } from "../types";
import { getCurrentMonth, formatMonth } from "../utils/date";
import { formatMoney } from "../utils/money";
import { PlanCard } from "./PlanCard";

type MonthlyPlansProps = {
  plans: SplitPlan[];
  productsById: Map<string, ProductEntry>;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
};

export function MonthlyPlans({ plans, productsById, onToggleStatus }: MonthlyPlansProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const availableMonths = useMemo(() => {
    const months = new Set(plans.map((plan) => plan.targetMonth));
    months.add(getCurrentMonth());
    return Array.from(months).sort();
  }, [plans]);
  const monthPlans = plans.filter((plan) => plan.targetMonth === selectedMonth);
  const total = monthPlans.reduce((sum, plan) => sum + plan.allocatedAmount, 0);

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">月別予定一覧</p>
        <h2>{formatMonth(selectedMonth)}</h2>
      </div>

      <label className="field">
        <span>対象月</span>
        <input
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          list="available-months"
        />
        <datalist id="available-months">
          {availableMonths.map((month) => (
            <option key={month} value={month} />
          ))}
        </datalist>
      </label>

      <div className="summary-strip single">
        <div>
          <span>合計金額</span>
          <strong>{formatMoney(total)}</strong>
        </div>
      </div>

      {monthPlans.length === 0 ? (
        <p className="empty-message">この月の分割入力予定はありません。</p>
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
