type TabsProps<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  activeTab: T;
  onChange: (tabId: T) => void;
};

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <nav className="tabs" aria-label="画面切り替え">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={tab.id === activeTab ? "tab active" : "tab"}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
