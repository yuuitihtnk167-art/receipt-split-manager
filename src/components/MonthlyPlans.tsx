import { useState } from "react";
import type { PlanStatus, ProductEntry, SplitPlan, SplitSetting } from "../types";
import {
  formatMonth,
  getDisplayMonthForDate,
  getTodayDate,
} from "../utils/date";
import { PlanCard } from "./PlanCard";

type MonthlyPlansProps = {
  plans: SplitPlan[];
  productsById: Map<string, ProductEntry>;
  settingsByProductId: Map<string, SplitSetting>;
  closingDay: number;
  onToggleStatus: (planId: string, status: PlanStatus) => void;
  onToggleRemainderStatus: (planId: string, status: PlanStatus) => void;
};

export function MonthlyPlans({
  plans,
  productsById,
  settingsByProductId,
  closingDay,
  onToggleStatus,
  onToggleRemainderStatus,
}: MonthlyPlansProps) {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getDisplayMonthForDate(getTodayDate(), closingDay),
  );
  const monthPlans = plans.filter((plan) => plan.targetMonth === selectedMonth);

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
        />
      </label>

      {monthPlans.length === 0 ? (
        <p className="empty-message">この月の分割入力予定はありません。</p>
      ) : (
        <div className="card-list">
          {monthPlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              product={productsById.get(plan.productEntryId)}
              setting={settingsByProductId.get(plan.productEntryId)}
              onToggleStatus={onToggleStatus}
              onToggleRemainderStatus={onToggleRemainderStatus}
              showRemainderTask
            />
          ))}
        </div>
      )}
    </section>
  );
}
