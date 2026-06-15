import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBackupFilename,
  loadLastBackupFilename,
  saveLastBackupFilename,
} from "./backupHistory";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("backup history", () => {
  it("creates a filename with seconds", () => {
    expect(createBackupFilename(new Date(2026, 5, 15, 12, 34, 56))).toBe(
      "expense-split-manager-backup-2026-06-15T12-34-56.json",
    );
  });

  it("saves and loads the last backup filename", () => {
    const values = new Map<string, string>();

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });

    saveLastBackupFilename("backup.json");

    expect(loadLastBackupFilename()).toBe("backup.json");
  });

  it("returns null when no filename has been saved", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
    });

    expect(loadLastBackupFilename()).toBeNull();
  });
});
