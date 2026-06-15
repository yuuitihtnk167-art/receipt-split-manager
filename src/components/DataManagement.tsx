import { ChangeEvent, useRef, useState } from "react";
import {
  createBackupFilename,
  loadLastBackupFilename,
  saveLastBackupFilename,
} from "../backupHistory";
import { normalizeImportedAppData } from "../storage";
import type { AppData } from "../types";
import {
  formatDate,
  getActualClosingDate,
  getCurrentMonth,
} from "../utils/date";

type DataManagementProps = {
  data: AppData;
  onImportData: (data: AppData) => void;
  onUpdateSettings: (settings: AppData["settings"]) => void;
};

export function DataManagement({
  data,
  onImportData,
  onUpdateSettings,
}: DataManagementProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [isBackupHelpOpen, setIsBackupHelpOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<AppData | null>(
    null,
  );
  const [lastBackupFilename, setLastBackupFilename] = useState<string | null>(
    () => loadLastBackupFilename(),
  );
  const totalPlans = data.splitPlans.length;
  const totalProducts = data.productEntries.length;
  const totalCategories = data.categories.length;
  const actualClosingDate = getActualClosingDate(
    getCurrentMonth(),
    data.settings.closingDay,
  );

  function handleClosingDayChange(event: ChangeEvent<HTMLSelectElement>): void {
    onUpdateSettings({
      ...data.settings,
      closingDay: Number(event.target.value),
    });
  }

  function handleExport(): void {
    const filename = createBackupFilename();
    const json = JSON.stringify(data, null, 2);

    setLastBackupFilename(filename);
    try {
      saveLastBackupFilename(filename);
    } catch {
      // The download should continue even when browser storage is unavailable.
    }
    downloadFile(filename, json, "application/json");
    setMessage(`${filename} を作成しました。`);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const importedData = normalizeImportedAppData(parsed, data.settings);

      if (!importedData) {
        setMessage("読み込めないJSONです。バックアップファイルを確認してください。");
        return;
      }

      setPendingImportData(importedData);
    } catch {
      setMessage("JSONファイルの読み込みに失敗しました。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function confirmImport(): void {
    if (!pendingImportData) {
      return;
    }

    onImportData(pendingImportData);
    setPendingImportData(null);
    setMessage("バックアップから復元しました。");
  }

  function cancelImport(): void {
    setPendingImportData(null);
    setMessage("インポートをキャンセルしました。");
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">設定</p>
        <h2>締め日とデータ管理</h2>
      </div>

      <article className="item-card">
        <div>
          <p className="item-title">締め日設定</p>
          <p className="item-subtitle">
            土曜日・日曜日・日本の祝日に当たる場合は、直前の平日を実際の締め日として使用します。
          </p>
        </div>
        <label className="field closing-day-field">
          <span>基準締め日</span>
          <select
            value={data.settings.closingDay}
            onChange={handleClosingDayChange}
          >
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={day}>
                {day}日
              </option>
            ))}
          </select>
        </label>
        <div className="setting-status">
          <span>現在の設定</span>
          <strong>{data.settings.closingDay}日</strong>
          <span>今月の実際の締め日</span>
          <strong>{formatDate(actualClosingDate)}</strong>
        </div>
        <p className="item-subtitle">選択すると自動的に保存されます。</p>
      </article>

      <div className="summary-strip">
        <div>
          <span>商品データ</span>
          <strong>{totalProducts}件</strong>
        </div>
        <div>
          <span>分割予定</span>
          <strong>{totalPlans}件</strong>
        </div>
        <div>
          <span>分割設定</span>
          <strong>{data.splitSettings.length}件</strong>
        </div>
        <div>
          <span>カテゴリ大分類</span>
          <strong>{totalCategories}件</strong>
        </div>
      </div>

      <article className="item-card">
        <div className="backup-heading">
          <p className="item-title">JSONバックアップ</p>
          <button
            type="button"
            className="secondary-button backup-help-button"
            onClick={() => setIsBackupHelpOpen(true)}
          >
            ヘルプ
          </button>
        </div>
        <div className="data-actions">
          <button type="button" className="primary-button" onClick={handleExport}>
            エクスポート
          </button>
          <label className="file-button">
            インポート
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
            />
          </label>
        </div>
        {message && <p className="info-message">{message}</p>}
      </article>

      {isBackupHelpOpen && (
        <div className="dialog-backdrop">
          <section
            className="edit-dialog backup-help-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="backup-help-title"
          >
            <div className="dialog-heading">
              <h3 id="backup-help-title">JSONバックアップについて</h3>
            </div>
            <p>
              登録した商品、分割予定、入力済み状態、カテゴリ情報、締め日設定をJSON形式でバックアップできます。機種変更やデータ復元の際に使用してください。
            </p>
            <BackupFilename filename={lastBackupFilename} />
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsBackupHelpOpen(false)}
            >
              閉じる
            </button>
          </section>
        </div>
      )}

      {pendingImportData && (
        <div className="dialog-backdrop">
          <section
            className="edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-confirm-title"
          >
            <div className="dialog-heading">
              <h3 id="import-confirm-title">バックアップから復元</h3>
            </div>
            <p>
              現在のデータを、選択したバックアップ内容で上書きします。よろしいですか？
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={cancelImport}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={confirmImport}
              >
                復元
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function BackupFilename({ filename }: { filename: string | null }) {
  return (
    <div className="backup-filename">
      <span>前回保存したファイル：</span>
      <strong>{filename ?? "なし"}</strong>
    </div>
  );
}

function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
