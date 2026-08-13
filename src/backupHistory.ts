const LAST_BACKUP_FILENAME_KEY =
  "receipt-split-manager:last-backup-filename";
const LEGACY_LAST_BACKUP_FILENAME_KEY =
  "expense-split-manager:last-backup-filename";

export function loadLastBackupFilename(): string | null {
  try {
    const filename = localStorage.getItem(LAST_BACKUP_FILENAME_KEY);

    if (filename) {
      return filename;
    }

    const legacyFilename = localStorage.getItem(LEGACY_LAST_BACKUP_FILENAME_KEY);

    if (legacyFilename) {
      try {
        localStorage.setItem(LAST_BACKUP_FILENAME_KEY, legacyFilename);
      } catch {
        // The legacy filename can still be displayed when migration fails.
      }
    }

    return legacyFilename;
  } catch {
    return null;
  }
}

export function saveLastBackupFilename(filename: string): void {
  localStorage.setItem(LAST_BACKUP_FILENAME_KEY, filename);
}

export function createBackupFilename(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `receipt-split-manager-backup-${year}-${month}-${day}T${hour}-${minute}-${second}.json`;
}
