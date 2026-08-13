import type { AppData, CategoryGroup } from "./types";
import { defaultCategories } from "./categories";
import { defaultAppSettings, normalizeAppSettings } from "./settings";
import {
  addMonths,
  getDisplayMonthForDate,
  getTodayDate,
} from "./utils/date";

const STORAGE_KEY = "receipt-split-manager:v1";
const CURRENT_MIGRATION_VERSION = 5;

export const emptyAppData: AppData = {
  productEntries: [],
  splitSettings: [],
  splitPlans: [],
  categories: defaultCategories,
  settings: defaultAppSettings,
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
      settings: normalizeAppSettings(parsed.settings),
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

export function normalizeImportedAppData(
  value: unknown,
  fallbackSettings = defaultAppSettings,
): AppData | null {
  if (!isObject(value)) {
    return null;
  }

  const maybeData = "data" in value && isObject(value.data) ? value.data : value;

  if (
    !Array.isArray(maybeData.productEntries) ||
    !Array.isArray(maybeData.splitSettings) ||
    !Array.isArray(maybeData.splitPlans)
  ) {
    return null;
  }

  return {
    productEntries: maybeData.productEntries,
    splitSettings: maybeData.splitSettings,
    splitPlans: maybeData.splitPlans,
    categories:
      Array.isArray(maybeData.categories) && maybeData.categories.length > 0
        ? (maybeData.categories as CategoryGroup[])
        : defaultCategories,
    settings:
      "settings" in maybeData
        ? normalizeAppSettings(maybeData.settings)
        : fallbackSettings,
    migrationVersion:
      typeof maybeData.migrationVersion === "number"
        ? maybeData.migrationVersion
        : undefined,
  } as AppData;
}

export function migrateAppData(
  data: AppData,
  currentMonth = getDisplayMonthForDate(
    getTodayDate(),
    data.settings.closingDay,
  ),
): AppData {
  const migrationVersion = data.migrationVersion ?? 0;

  if (migrationVersion >= CURRENT_MIGRATION_VERSION) {
    return data;
  }

  const nextMonth = addMonths(currentMonth, 1);
  const productsPendingNextMonth = new Set(
    data.splitPlans
      .filter(
        (plan) =>
          plan.targetMonth === nextMonth &&
          plan.status === "pending",
      )
      .map((plan) => plan.productEntryId),
  );

  return {
    ...data,
    categories:
      migrationVersion < 5
        ? migrateFoodSubcategories(data.categories)
        : data.categories,
    splitPlans: data.splitPlans.map((plan) => {
      const isPastMonth = plan.targetMonth < currentMonth;
      const shouldMigrateStatus =
        migrationVersion < 1 && isPastMonth && plan.status !== "done";
      const shouldMigrateRemainderStatus =
        migrationVersion < 2 &&
        isPastMonth &&
        plan.remainderStatus !== undefined &&
        plan.remainderStatus !== "done";
      const shouldRestoreCurrentStatus =
        migrationVersion < 4 &&
        plan.targetMonth === currentMonth &&
        plan.status === "done" &&
        productsPendingNextMonth.has(plan.productEntryId);

      if (
        !shouldMigrateStatus &&
        !shouldMigrateRemainderStatus &&
        !shouldRestoreCurrentStatus
      ) {
        return plan;
      }

      return {
        ...plan,
        status: shouldRestoreCurrentStatus
          ? ("pending" as const)
          : shouldMigrateStatus
            ? ("done" as const)
            : plan.status,
        remainderStatus:
          shouldRestoreCurrentStatus && plan.remainderStatus === "done"
            ? ("pending" as const)
            : shouldMigrateRemainderStatus
              ? ("done" as const)
              : plan.remainderStatus,
      };
    }),
    settings: normalizeAppSettings(data.settings),
    migrationVersion: CURRENT_MIGRATION_VERSION,
  };
}

function migrateFoodSubcategories(categories: CategoryGroup[]): CategoryGroup[] {
  const defaultFoodCategory = defaultCategories.find(
    (category) => category.name === "食費",
  );

  if (!defaultFoodCategory) {
    return categories;
  }

  const defaultNames = new Set(
    defaultFoodCategory.subcategories.map((subcategory) => subcategory.name),
  );

  return categories.map((category) => {
    if (category.name !== defaultFoodCategory.name) {
      return category;
    }

    const customSubcategories = category.subcategories.filter(
      (subcategory) => !defaultNames.has(subcategory.name),
    );

    return {
      ...category,
      subcategories: [
        ...defaultFoodCategory.subcategories,
        ...customSubcategories,
      ],
    };
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
