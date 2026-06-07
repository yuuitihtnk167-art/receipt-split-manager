import type { AppData } from "./types";
import { defaultCategories } from "./categories";
import { getCurrentMonth } from "./utils/date";

const STORAGE_KEY = "receipt-split-manager:v1";
const CURRENT_MIGRATION_VERSION = 1;

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
  if ((data.migrationVersion ?? 0) >= CURRENT_MIGRATION_VERSION) {
    return data;
  }

  return {
    ...data,
    splitPlans: data.splitPlans.map((plan) =>
      plan.targetMonth < currentMonth && plan.status !== "done"
        ? { ...plan, status: "done" as const }
        : plan,
    ),
    migrationVersion: CURRENT_MIGRATION_VERSION,
  };
}
