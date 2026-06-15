const LAST_BACKUP_FILENAME_KEY =
  "expense-split-manager:last-backup-filename";

export function loadLastBackupFilename(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_FILENAME_KEY);
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

  return `expense-split-manager-backup-${year}-${month}-${day}T${hour}-${minute}-${second}.json`;
}
