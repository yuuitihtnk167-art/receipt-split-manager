import type { AppData } from "./types";
import { defaultCategories } from "./categories";
import { getCurrentMonth } from "./utils/date";

const STORAGE_KEY = "receipt-split-manager:v1";
const CURRENT_MIGRATION_VERSION = 2;

export const emptyAppData: AppData = {
  productEntries: [],
  splitSettings: [],
  splitPlans: [],
  categories: defaultCategories,
  migrationVersion: CURRENT_MIGRATION_VERSION,
};

export function loadAppData(): AppData {
  const rawData = localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return emptyAppData;
  }

  try {
    const parsed = JSON.parse(rawData) as Partial<AppData>;

    const data: AppData = {
      productEntries: Array.isArray(parsed.productEntries) ? parsed.productEntries : [],
      splitSettings: Array.isArray(parsed.splitSettings) ? parsed.splitSettings : [],
      splitPlans: Array.isArray(parsed.splitPlans) ? parsed.splitPlans : [],
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : defaultCategories,
      migrationVersion:
        typeof parsed.migrationVersion === "number"
          ? parsed.migrationVersion
          : undefined,
    };
    const migratedData = migrateAppData(data);

    if (migratedData !== data) {
      try {
        saveAppData(migratedData);
      } catch {
        return migratedData;
      }
    }

    return migratedData;
  } catch {
    return emptyAppData;
  }
}

export function saveAppData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function migrateAppData(
  data: AppData,
  currentMonth = getCurrentMonth(),
): AppData {
  const migrationVersion = data.migrationVersion ?? 0;

  if (migrationVersion >= CURRENT_MIGRATION_VERSION) {
    return data;
  }

  return {
    ...data,
    splitPlans: data.splitPlans.map((plan) => {
      const isPastMonth = plan.targetMonth < currentMonth;
      const shouldMigrateStatus =
        migrationVersion < 1 && isPastMonth && plan.status !== "done";
      const shouldMigrateRemainderStatus =
        migrationVersion < 2 &&
        isPastMonth &&
        plan.remainderStatus !== undefined &&
        plan.remainderStatus !== "done";

      if (!shouldMigrateStatus && !shouldMigrateRemainderStatus) {
        return plan;
      }

      return {
        ...plan,
        status: shouldMigrateStatus ? ("done" as const) : plan.status,
        remainderStatus: shouldMigrateRemainderStatus
          ? ("done" as const)
          : plan.remainderStatus,
      };
    }),
    migrationVersion: CURRENT_MIGRATION_VERSION,
  };
}
